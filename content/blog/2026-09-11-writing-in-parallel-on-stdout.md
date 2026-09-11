---
layout: blog-post
date: "2026-09-11"
title: "Writing in parallel on the standard output"
category: 
tags: [Rust]
---

In a library that I am developing, [pardi](https://github.com/edap/pardi/), I stumbled upon a problem that has a simple solution but that involves an understanding of interior mutability, closures and parallelism. I have isolated the problem in a small example and I am going to explain what I have learned.

Suppose that we have a very long process running that needs to process many tasks and present its results on standard output.
This is the first naive version of the code. A single thread, using a standard mutable handle to write each line directly to standard output 


```rust
use std::io::{self, Write};

fn main() -> io::Result<()> {
    let mut stdout = io::stdout();
    let tasks = vec!["Task 1", "Task 2", "Task 3", "Task 4" ];

    for t in tasks {
        writeln!(stdout, "{}", t)?;
    }

    Ok(())
}
```

Then, we  decide to optimize our program and to run these tasks in parallel. In Rust its easy, we need to add the `rayon` crate, and to change the iterator to `par_iter()`

```rust
use rayon::prelude::*;
use std::io::{self, Write};

fn main() -> io::Result<()> {
    let mut stdout = io::stdout();
    let tasks = vec!["Task 1", "Task 2", "Task 3", "Task 4" ];

    tasks.par_iter().for_each(|task| {
        writeln!(stdout, "{}", task);
    });

    Ok(())
}
```

It works right? no, we have this error:

```rust
error[E0596]: cannot borrow `stdout` as mutable, as it is a captured variable in a `Fn` closure
  --> src/main.rs:10:18
   |
 6 |     let mut stdout = io::stdout();
   |         ---------- `stdout` declared here, outside the closure
...
 9 |     tasks.par_iter().for_each(|task| {
   |                               ------ in this closure
10 |         writeln!(stdout, "{}", task);
   |                  ^^^^^^ cannot borrow as mutable

For more information about this error, try `rustc --explain E0596`.
```


Why? because of two problems, the first one is the more obvious one, we are breaking the Exclusive Mutability Rule. That is,  for any given value, you can have either one mutable reference `(&mut T)` or any number of shared references `(&T)` at a time, but never both simultaneously. the macro `writeln!` requires a mutable reference `&mut stdout` to write data, meaning only one thing can write to it at a exact time.

The second problem is more complex and it is related to how this closure captures the `stdout` variable declared outside of its scope.


```rust
|task| {
    writeln!(stdout, "{}", task);
}
```


Closures can capture variables in 3 different ways:
- `Fn` -> An immutable borrow. Usually when they just read a value. for example, this is `Fn` closure.

    ```rust
    let name = String::from("Davide");
    let greet = || {
        println!("{}", name);
    };
    ```

- `FnMut` -> A mutable borrow. The closure modifies the captured variable
    ```rust
    let mut counter = 0;

    let increment = || {
        counter += 1;
    };

    increment();
    increment();
    increment();
    // counter is now == 3
    ```

- `FnOnce` -> The take ownership of the variable. We say that the closure consumes the variable.

    ```rust
    let name = String::from("Davide");
    let consume = move || {
        println!("{}", name);
    };
    ```


The closure uses `stdout`, therefore, it should capture it. The question is, how does it capture it? `Fn`, `FnMut` or`FnOnce` ? Let's have a look at the `writeln!` macro, and we will see that it takes as argument a mutable variable, because it needs to write on it, to modify it's content. We see now that `writeln!(stdout, "{}", task)` needs mutable access to stdout. So the closure needs to capture `stdout` mutably.

But the `ParallelIterator::for_each` requires a closure that is safe to call through shared references, it requires a `Fn` closure, as the error message says. So basically, rayon says "I want an Fn closure because I need to call you from multiple threads at the same time" but the closure says "I need mutable access to my captured stdout because I need to modify it's content". This is a problem! how do we solve this? 🤔

In Rust there is a concept called "interior mutability", and it is used to relax a bit the rigid rules of immutability. It basically allows the programmer to introduce a little bit of mutable data inside an immutable value. The Rust book focuses on [RfCell](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html) but in this case, interior mutability is introduced by a `Mutex`.

I basically create a struct called `StreamWriter` that contain a `Mutex`, i pass this struct to rayon, that stops complaining as I am giving as argument a `Fn` closure, and then, when I need to write data, i call `self.my_mutex.lock()`, that gives me back a `MutexGuard` that has type `&mut Box<dyn Write>` which means exclusive mutable access to the content.

This is how interior mutability solved my problem, all the pieces of my programs are now happy:
- The closure only needs shared access to StreamWriter.
- Multiple threads can share &StreamWriter.
- The Mutex internally ensures that only one thread gets &mut Write at a time.

This is the working code.


```rust
use rayon::prelude::*;
use std::io::{self, Write};
use std::sync::Mutex;

pub struct StreamWriter {
    writer: Mutex<Box<dyn Write + Send>>,
}

impl StreamWriter {
    pub fn new(writer: Box<dyn Write + Send>) -> Self {
        Self {
            writer: Mutex::new(writer),
        }
    }

    /// Safely writes a line from any thread without interleaving output.
    pub fn write_line(&self, line: &str) -> io::Result<()> {
        let mut writer = self.writer.lock().unwrap();
        writeln!(writer, "{}", line)
    }
}

fn main() -> io::Result<()> {
    //dyn Write is a trait object and therefore has no known size at compile time.
    // Box stores the actual writer on the heap and keeps a fixed-size pointer to it.
    let writer = StreamWriter::new(Box::new(io::stdout()));

    let tasks = vec!["Processing file 1", "Processing file 2", "Processing file 3", "Processing file 4"];

    tasks.par_iter().for_each(|task| {
        // Each worker thread can call write_line concurrently
        if let Err(e) = writer.write_line(task) {
            eprintln!("Error writing output: {}", e);
        }
    });

    Ok(())
}

```



**Why This Data Structure Works**

* **`Mutex<T> :** Think of a Mutex like a single key to a room. Since multiple threads are trying to write to the screen at the exact same time, their text would get completely mixed up and messy. The mutex ensures that only one thread grabs the "lock" at a time, writes its line, and then hands the key to the next thread.
* **`Box<dyn Write + Send>` :**
* **`dyn Write`:** This makes the writer universal. Because it accepts *any* type that implements Rust's `Write` trait, the struct doesn't just work for `io::stdout()`, it can also write to a local log file or an in-memory test buffer without changing the logic of the program.
* **`Send`:** tells the Rust compiler that ownership of the writer can safely be transferred between threads.


Because the tasks are processed in parallel, the order of the output is not guaranteed. You may have results like this:

```
Processing file 3
Processing file 1
Processing file 4
Processing file 2
```