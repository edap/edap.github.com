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

- immutable borrow: `&T` -> `Fn`. When a closure only needs to read a captured value, it can capture it through an immutable borrow.

    ```rust
    let name = String::from("Davide");
    let greet = || {
        println!("{}", name);
    };
    ```
    This type of closure can implement Fn, meaning it can be called multiple times without mutating its captured environment.

- Mutable borrow: &mut T -> `FnMut`. When a closure needs to modify a captured value, it captures it through a mutable borrow.

    ```rust
    let mut counter = 0;

    let mut increment = || {
        counter += 1;
    };


    increment();
    increment();
    increment();
    // counter is now == 3
    ```
    This closure requires FnMut because calling it mutates its captured environment.

- Taking ownership: `T` -> `FnOnce`. When a closure consumes a captured value, it takes ownership of it.

    ```rust
    let name = String::from("Davide");
    let consume = || {
        drop(name);
    };
    ```

    This closure implements FnOnce because it consumes name and can therefore only be called once.

This is a useful mental model, although technically Fn, FnMut, and FnOnce are closure traits, while &T, &mut T, and T describe how a value is captured.

| Capture mode    | Closure Trait   |
| --------        | -------         |
| &T              | Fn              |
| &mut T          | FnMut           |
| T               | FnOnce          |


The closure uses `stdout`, therefore, it should capture it. The question is, how does it capture it? `Fn`, `FnMut` or`FnOnce` ? Let's have a look at the `writeln!` macro. It implements the Write trait `fn write(&mut self, buf: &[u8]) -> Result<usize>;`.Writing therefore requires mutable access to the writer. So, because `stdout` is declared outside the closure and the closure needs mutable access to it, the closure captures stdout through a mutable borrow. 

But the `ParallelIterator::for_each` requires a closure that is safe to call through shared references, it requires a `Fn` closure, as the error message says. So basically, rayon says "I need an Fn closure because I may call it concurrently from multiple worker threads." but the closure says "I need mutable access to my captured stdout because because the write trait requires &mut stdout". This is a problem! how do we solve this? 🤔

In Rust there is a concept called "interior mutability", and it is used to relax a bit the rigid rules of immutability. It basically allows the programmer to introduce a little bit of mutable data inside an immutable value. The Rust book focuses on [RfCell](https://doc.rust-lang.org/book/ch15-05-interior-mutability.html) but in this case, interior mutability is provided by a `Mutex`.

I created a struct called StreamWriter containing a Mutex. The closure passed to Rayon only needs shared access to StreamWriter, so it can satisfy Rayon's requirement for an Fn closure. Then, when a thread needs to write data, `write_line()` calls `self.writer.lock()`. This returns a `MutexGuard`. The guard provides exclusive access to the value stored inside the mutex and behaves like a mutable reference to it. When the MutexGuard goes out of scope, the lock is automatically released..

This is how interior mutability solves the problem.

This is how interior mutability solved my problem, all the pieces of my programs are now happy:

- The closure only needs shared access to StreamWriter.
- Multiple threads can share &StreamWriter.
- The `Mutex` provides exclusive access to the writer
- Only one thread gets mutable access to `Write` at a time.

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

* **`Mutex<T>` :** like a single key to a room. Multiple threads may want to write at the same time, but only one thread can acquire the lock at a time. The mutex ensures that only one thread grabs the "lock" at a time, writes its line, and then hands the key to the next thread.
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