---
layout: post
title: "#3 observer pattern"
category:
tags: [design patterns, observer pattern, ruby]
---
 
The observer pattern helps us when we need to spread informations across our application. A system where every part is aware of the state of the whole is better than a system where each object should be manually notify for every small change. How is it possible to accomplish this task without coupling our objects?
Let's say we have just moved in a new flat, and every documents should be updates; driving license, passport, health insurance card... etc. Would be great if at the same time we change address, automatically our passport will be up-to date. That's what the observer pattern would do:

{% highlight ruby %}
class Person

  attr_reader :name, :age
  attr_reader :address

  def initialize( name, age, address )
    @name = name
    @age = age
    @address = address
    @observers = []
  end

  def address=(new_address)
    @address = new_address
    notify_observers
  end

  def add_observer(observer)
    @observers << observer
  end

  def delete_observer(observer)
    @observers.delete(observer)
  end

  def notify_observers
    @observers.each do |observer|
      observer.update(self)
    end
  end

end
{% endhighlight ruby %}
The important thing to know here is that the @observers variable is an array, and could contain more than one objects, as more than one item needs to be notified.

{% highlight ruby %}
class Passport

  def update( changed_person )
    puts("I have to update the citizen #{changed_person.name}!")
    puts("His address is now #{changed_person.address}!")
  end

end
{% endhighlight ruby %}

{% highlight ruby %}
class DrivingLicense

  def update( changed_person )
    puts("I'm the driving license! I have to update the citizen #{changed_person.name}!")
    puts("His address is now #{changed_person.address}!")
  end

end
{% endhighlight ruby %}
And here the implementation

{% highlight ruby %}
lucky_guy = Person.new('Bob', 30, 'Karl Marx strasse, Berlin')
passport = Passport.new
driving_license = DrivingLicense.new
lucky_guy.add_observer(passport)
lucky_guy.add_observer(driving_license)
lucky_guy.address = 'Gustav Mueller Str., Berlin'
{% endhighlight bash %}

[The Gang of Four](http://www.amazon.com/Design-Patterns-Elements-Reusable-Object-Oriented/dp/0201633612) defines two types of object. The _subject_, the object that has the news, and the _observer_, the object that want to know the news. In this case is pretty clear that the object is the Person, and the rest are the observers.

But what if in our application there are more than one Subjects, and we want to reuse the code that add and remove the observer? Let's pack this code in a module:

{% highlight ruby %}
module Subject
  def initialize
    @observers=[]
  end

  def add_observer(observer)
    @observers << observer
  end

  def delete_observer(observer)
    @observers.delete(observer)
  end

  def notify_observers
    @observers.each do |observer|
      observer.update(self)
    end
  end

end
{% endhighlight bash %}

Our Person class can now include all the methods present in the Subject module, and simplify the process to add others subjects to our application.

{% highlight ruby %}
class Person
  include Subject

  attr_reader :name, :age
  attr_reader :address

  def initialize( name, age, address )
    super()
    @name = name
    @age = age
    @address = address
  end

  def address=(new_address)
    @address = new_address
    notify_observers
  end

end
{% endhighlight ruby %}

The method `super` (in ruby, only the method `super` needs the two `()` also if there is no argument ), is used to call the initialize method in the Subject module. In real world application, there is no need to create the subject module, the Ruby standard  library comes with a predefined 'Observable' module, that, when included, tranform the object in a subject. The only thing that has changed, is that the `Observable` module requires that the subject calls the method `changed` before `notify_observers` every time the object is changed.This method sets a flag in the object to `true`, when the `notify_object` method finish his task, the flag is set back to `false`. Here the example

{% highlight ruby %}
require 'observer'

class Person
  include Observable
  attr_reader :name, :age
  attr_reader :address

  def initialize( name, age, address)
    @name = name
    @age = age
    @address = address
  end

  def address=(new_address)
    @address = new_address
    changed
    notify_observers(self)
  end
end
{% endhighlight ruby %}

As in the previous posts regarding design patterns in ruby (all of them inspired by the [book wrote by Russ Olsen](http://www.amazon.com/Design-Patterns-Ruby-Russ-Olsen/dp/0321490452)), the code's example are available [here](https://github.com/edap/design-patterns)

