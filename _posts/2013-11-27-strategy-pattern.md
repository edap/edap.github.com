---
layout: post
title: "#2 strategy pattern"
category:
tags: [ruby, design patterns, strategy pattern]
---
 
Last time we have a look at the [template pattern in ruby](http://edapx.com/2013/10/27/template-pattern/). The problem was, how can we put in a separate part the thing that is gonna to change? the solution implemented was to create a template class and to use subclasses to fill out the details. The template pattern has one drawback, is based on inheritance. That means that the subclasses are tangled up with the template class.

### Prefer delegation over inheritance

The alternative is to isolate the thing that is gonna to change in a separate class. Let's continue with the example of the magic cutter, this tool for the kitchen that can cuts/slices/trims every kind of vegetable. Let's isolate the different procedures for each vegetable, aubergine and potato. Let's assume that in this example, the thing that always remains the same is the number of items that we are gonna to prepare, and the "algorithm" that changes is the procedure we use to cut the vegetable.

{% highlight ruby %}
require_relative 'magic_cutter'

class PotatoFormatter

  def give_me_the_vegetable_cutted_off(context)
    puts "Hey! we have #{context.number_vegetables} potatoes"
    puts "skin the potato"
    puts "i take a professional potato cutter for my french fries"
    puts "put the potato in the cutter an press it"
  end

end

c = MagicCutter.new(PotatoFormatter.new)
c.give_me_the_vegetable_cutted_off
{% endhighlight ruby %}

{% highlight ruby %}
require_relative 'magic_cutter'

class AubergineFormatter

  def give_me_the_vegetable_cutted_off(context)
    puts "Hey! we have #{context.number_vegetables} aubergine"
    puts "i need a very sharp knife"
    puts "I slice the aubergine in long thumbsized pieces, ready to be grilled"
  end

end

c = MagicCutter.new(AubergineFormatter.new)
c.give_me_the_vegetable_cutted_off
{% endhighlight ruby %}

We have removed the details of preparing the vegetable from our MagicCutter class, that look shorter and easier
{% highlight ruby %}
class MagicCutter
  attr_accessor :vegetable_formatter
  attr_reader :number_vegetables

  def initialize formatter
    @number_vegetables = 4
    @vegetable_formatter = formatter
  end

  def give_me_the_vegetable_cutted_off
    @vegetable_formatter.give_me_the_vegetable_cutted_off(self)
  end

end
{% endhighlight ruby %}

And that's a practical implementation of the two formatter

{% highlight ruby %}
c = MagicCutter.new(PotatoFormatter.new)
c.give_me_the_vegetable_cutted_off

c = MagicCutter.new(AubergineFormatter.new)
c.give_me_the_vegetable_cutted_off
{% endhighlight ruby %}


> The GoF call this "pull the algorithm out into a separate object" technique the
> Strategy pattern. The key idea underlying the Strategy pattern is to define
> a family of objects, the strategies, which all do the same thing.

The key concept of the strategy pattern, is to isolate the things that do the same thing (cutting vegetables) and to put them in different strategies. Both, the PotatoFormatter and the AubergineFormatter, are doing the same thing and have the same interface method, the 'give_me_the_vegetable_cutted_off'. That means that from an external point of view, all the strategies look alike, and can be used in the same way, they are interchangeables. But they are not realy the same, because each class is doing something slightly different. If in a future we will have other vegetables, we will simply add a new strategy, without touching a single line of code in the MagicCutter class. That's one of the advantage to base our design on composition instead inheritance. The other one, is that it is easy to switch strategy at runtime.

>The Strategy pattern does have one thing in common with the Template Method
>pattern: Both patterns allow us to concentrate the decision about which variation we
>are using in one or a few places. With the Template Method pattern, we make our
>decision when we pick our concrete subclass. In the Strategy pattern, we make our
>decision by selecting a strategy class at runtime.
