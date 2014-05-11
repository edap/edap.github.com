---
layout: post
title: "Getting started with Scala"
category:
tags: [scala]
---
 
A collegue of mine told me about Scala "a functional programming language with OOP features, has to be compiled and run on the JVM". I've never tried it before, but i was curious.

### Installation
This installation instructions works in all debian based distros. Download scala form [here](http://www.scala-lang.org/download)

{% highlight bash %}
sudo dpkg -i scala-2.10.3.deb
{% endhighlight bash %}

The packaged version of eclipse on debian is still 3.8, so i've downloaded the 4.3 with scala plugin from the [scala IDE website](http://scala-ide.org/download/sdk.html)

After that you have to add the SCALA_HOME variable to your .bashrc (or .zshrc) file.
Run the command `scala which` in order to get the path of the scala executable, that should be `usr/bin/scala`
{% highlight bash %}
$SCALA_HOME="/usr/bin/scala"
{% endhighlight bash %}
Add $SCALA_HOME to your $PATH variable. Now you are ready for the first [Hello World tutorial in Scala](http://scala-lang.org/documentation/getting-started.html#your_first_lines_of_code)

The hello world tutorial is the standard first step. But pretty boring. I've find very useful to get an idea of the language the book "Scala for the impatient". It's possible to download a free pdf copy on the [Typesafe website](http://typesafe.com/resources/book/scala-for-the-impatient). From this book is token the lines that follow about the Scala interpreter, the "REPL"

### Using The REPL to understanding variables
when we execute a command in the "interpreter", the code will be compiled and executed. This process is called Read-Evel-Print loop, so, technically, scala programmers prefer to call the interpreter "REPL"

if you write in the REPL
{% highlight bash %}
scala> 10 * 20
{% endhighlight bash %}

the REPL will return
{% highlight bash %}
res0: Int = 42
{% endhighlight bash %}

res0 is the name of the variable saved. Int ist the datatype.
To define your own variable, simply

{% highlight bash %}
val city = "Berlin"
{% endhighlight bash %}

if we try to reassign it
{% highlight bash %}
city = "London"
{% endhighlight bash %}

we will get
{% highlight bash %}
error: reassignment to val
{% endhighlight bash %}

That happen because a variable declared with 'val' is a constant. To define a varibale that can change, use 'var'.  If Scala can figure out the type of something from the context, you don’t need to declare the type (this is called type inference).That means that the result in `city` is a String.
However, you can specify the type, if necessary. Ex:
{% highlight bash %}
var river:String = "Spree"
{% endhighlight bash %}

If we try to reassign this variable with an Int
{% highlight bash %}
scala> river = 2
<console>:8: error: type mismatch;
 found   : Int(2)
 required: String
       river = 2
              ^
{% endhighlight bash %}


It is also possible to declare more variables together, like in ruby
{% highlight bash %}
var a,b = "ciao"
{% endhighlight bash %}

Also scala as symbol instance, The scala `'foo` is equivalent to the ruby `@foo`

If you write the name of a variable followed by ".to" and press Tab,the repl will activate the autocompletition.
{% highlight bash %}
a.to
toCharArray   toLowerCase   toString      toUpperCase
{% endhighlight bash %}
You can call methods without using `.`
`ants.toUpperCase` is the same as `ants toUpperCase`
And also `()` are not necessary is the method as no argument

The REPL is really helpful, like irb in ruby or the python interpreter. As you may noticed, there are character to determine the end of a line. To copy and paste code directly in the REPL, type `copy:` and then paste the code.

### Types
There are 7 numeric types `Byte`, `Char`, `Short`, `Int`, `Long`, `Float`, `Double`, and a `Boolean` type. In reality, these types are all classes. This diagrams illustrate the [class Hierarchy in Scala](http://www.scala-lang.org/old/sites/default/files/images/classhierarchy.png). The mother of all classes is `scala.Any`, that has two subclasses` scala.Any.val` and `scala.Any.ref`.
`scala.AnyVal` is for the _values classes_ that are predefined(as Int, Char ecc...), `scala.AnyRef` define reference types. User-defined classes define _reference types_ by default, they are always a subclass of `scala.AnyRef`. A detailed explanation can be found [here](http://docs.scala-lang.org/tutorials/tour/unified-types.html)
Let's explore the values classes in the repl:
{% highlight bash %}
scala> 4
res13: Int = 4

scala> 3
res14: Int = 3

scala> 3.0
res15: Double = 3.0

scala> 3L
res16: Long = 3

scala> 4.0F
res17: Float = 4.0

scala> 3.toString
res18: String = 3
{% endhighlight bash %}
As in ruby, is possible to invoke methods on number `2.toString`, `2.to(12)`. To do that, Scala implicit convert the Int class in the RichInt class, a class that contains `toString` and `to(Int)`. The same happen for the string `"Mountain"` when we apply the method `intersect`.
{% highlight bash %}
"Mountain".intersect("River")
{% endhighlight bash %}
The example yeld `i`. Scala implicit convert the class String in a StringOps class, that contains the method `intersect`.

## Bitwise operation
With scala it's possible to work on individual bits using bitwise methods(bitwise-and `&`, bitwise-xor `^`, biwise-or `|`) and shift methods (shift right `>>`, shift left `<<`). For example

`1&2` biwise-ands each bit in 1(0001) and 2(0010), that is 0(0000) `Int = 0`

`1|2` biwise-ors each bit in 1(0001) or 2(0010), that is 0(0011) `Int = 3`

`1^3` biwise-xors each bit in 1(0001) or 3(0011), that is 0(0010) `Int = 2`

`1<<2` 1(0001) is shifted left 2 position, that is 4(0100) `Int = 4`

`32>>1` 32(100000) is shifted right 1 position, that is 16(010000) `Int = 16`


### Free Resources
* [Coursera, a free online course by the creator of scala](https://class.coursera.org/progfun-003/lecture/23)
* [Scala community](http://scala-lang.org/community/)
* [Scala school by twitter](http://twitter.github.io/scala_school/)
* [Effective scala](http://twitter.github.io/effectivescala/)
* [Another tour of scala](http://naildrivin5.com/scalatour/wiki_pages/MainPage)
* [simplyscala](http://www.simplyscala.com/)
* [Learning Scala in small bytes](http://matt.might.net/articles/learning-scala-in-small-bites/)
* [Scala Style Guide](http://docs.scala-lang.org/style/)
* [Scala Official Documentation](http://docs.scala-lang.org/tutorials/)
* [A short overview about identation](http://docs.scala-lang.org/style/indentation.html)



