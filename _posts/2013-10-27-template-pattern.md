---
layout: post
title: "#1 template pattern"
category:
tags: [ruby, design patterns, template pattern]
---
{% include JB/setup %}

With this blog post i would like to start to write a list of posts dedicated to design patterns in object oriented programming. If the most common design patterns are, after some years of practice, pretty well known, I found myself not always sure about which one should I use, and IF should I use them. Take this post as a kind o notes, or skip it and keep surfing, there are a lot of interesting things this sunday on the net. The programming language that I'm going to use is ruby, the book i'm using as main reference is [Design Patterns in Ruby](http://www.amazon.com/Design-Patterns-Ruby-Russ-Olsen/dp/0321490452) by [Russ Olsen](https://twitter.com/russolsen), the citations comes from this book.

### Separate the things that stay the same

An image that could be associated with the template pattern is "The Magic Cutter". The magic cutter is an essential tool fot the kitchen not yet invented. Basically, it takes any kind of vegetable and it chop it in the appropriate form. No matter which kind of vegetable, the thing that this tool is going to do is always the same, to give back the vegetables cutted of in the right shape. To perform this action, our magic tool has to:

+ Prepare the right blade for the vegetable
+ Cut/chop/trim/slice it in the right form

>Define an abstract base class with a master
>method that performs the basic steps listed above, but that leaves the details of each
>step to a subclass.

We will define a skeletal class that will serve as the basis for the different subclasses, like the PotatoCutter and the AubergineCutter.
{% highlight ruby %}
class MagicCutter
  def initialize vegetable
    @vegetable = vegetable
  end

  def give_me_the_vegetable_cutted_off
    prepapre_the_blade
    cut_the_vegetable
  end

  def prepapre_the_blade
    raise 'Called abstract method: prepapre_the_blade'
  end

  def cut_the_vegetable
    raise 'Called abstract method: cut_the_vegetable'
  end

end
{% endhighlight ruby %}

>the general idea of the Template Method pattern is to
>build an abstract base class with a skeletal method. This skeletal method (also called a
>template method) drives the bit of the processing that needs to vary, but it does so by
>making calls to abstract methods, which are then supplied by the concrete subclasses.
>We pick the variation that we want by selecting one of those concrete subclasses.

The skeletal method is 'give_me_the_vegetable_cutted_off', that is composed by others methods (like prepapre_the_blade, and cut_the_vegetable) that have different behaviours in each subclasses. The subclasses define only the things that are gonna to change, overriding the methods defined in the skeletal class, they DON'T touch the "give_me_the_vegetable_cutted_off", that is always the same.

Let's have a look at the two subclasses
{% highlight ruby %}
require_relative 'magic_cutter'

class PotatoCutter < MagicCutter

  def prepapre_the_blade
    puts "Hey! that's a #{@vegetable}"
    puts "i take a professional potato cutter for my french fries"
  end

  def cut_the_vegetable
    puts "put the #{@vegetable} in the cutter an press it"
  end

end
{% endhighlight ruby %}


{% highlight ruby %}
require_relative 'magic_cutter'

class AubergineCutter < MagicCutter

  def prepapre_the_blade
    puts "Hey! that's a #{@vegetable}"
    puts "i need a very sharp knife"
  end

  def cut_the_vegetable
    puts "I slice the #{@vegetable}  in long thumbsized pieces, ready to be grilled"
  end

end
{% endhighlight ruby %}

And their implementation

{% highlight ruby %}
au = AubergineCutter.new("Aubergine")
po = PotatoCutter.new("Potato")
au.give_me_the_vegetable_cutted_off
po.give_me_the_vegetable_cutted_off
{% endhighlight ruby %}

### Hook Methods.
Looking at the 2 subclasses it's possible to see that the the line "puts "Hey! that's a #{@vegetable}"" it is repeated two times and it's always the same. Looking deeper, we will see that the PotatoCutter is not skinning the vegetable off. Here is the right moment to introduce the Hook methods.
Non-abstract methods that can be overridden in the concrete classes of the Template Method pattern are called hook methods.

Hook methods permit to the subclass to:
 + Override the skeletal implementation and define something new (skinning the potato)
 + Accept the default implementation (truly excitement when you recognize the vegetables)

have a look in the example above about how are implemented the hook methods 'truly_excitement' and 'prepare_the_vegetable'


{% highlight ruby %}
class MagicCutter
  def initialize vegetable
    @vegetable = vegetable
  end

  def give_me_the_vegetable_cutted_off
    truly_excitement
    prepapre_the_vegetable
    prepapre_the_blade
    cut_the_vegetable
  end

  def truly_excitement
    puts "Hey! that's a #{@vegetable}"
  end

  def prepapre_the_vegetable
  end

  def prepapre_the_blade
    raise 'Called abstract method: prepapre_the_blade'
  end

  def cut_the_vegetable
    raise 'Called abstract method: cut_the_vegetable'
  end

end
{% endhighlight ruby %}

{% highlight ruby %}
require_relative 'magic_cutter'

class PotatoCutter < MagicCutter

  def prepapre_the_vegetable
    puts "skin the potato"
  end

  def prepapre_the_blade
    puts "i take a professional potato cutter for my french fries"
  end

  def cut_the_vegetable
    puts "put the potato in the cutter an press it"
  end

end

c = PotatoCutter.new("Potato")
c.give_me_the_vegetable_cutted_off
{% endhighlight ruby %}

{% highlight ruby %}
require_relative 'magic_cutter'

class AubergineCutter < MagicCutter

  def prepapre_the_blade
    puts "i need a very sharp knife"
  end

  def cut_the_vegetable
    puts "I slice the #{@vegetable}  in long thumbsized pieces, ready to be grilled"
  end

end

c = AubergineCutter.new("Aubergine")
c.give_me_the_vegetable_cutted_off
{% endhighlight ruby %}

> The default implementations of these informative hook methods are frequently
> empty. They exist merely to let the subclasses know what is happening but do not
> require the subclasses to override methods that do not interest them.

This apply to the prepare_vegetable method, where we leave to the subclass the decision about how to fullfill it.
These three code examples are published on my github [repository](https://github.com/edap/design-patterns). In this repo, will also be published the other design patterns implementations that will come in the future.

### Others links
[A really deep article by practicingruby, ](https://practicingruby.com/articles/unobtrusive-ruby-in-practice)
[a blog post by Tammer Saleh and ](http://tammersaleh.com/posts/the-template-pattern-is-underused/)

[a tutorial found on the web, with some interesting comments](http://reefpoints.dockyard.com/ruby/2013/07/10/design-patterns-template-pattern.html)
