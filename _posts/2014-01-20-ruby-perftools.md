---
layout: post
title: "ruby perftools"
category:
tags: [perftools, ruby]
draft: true
---

### CPU usage, use perftools
Perftools is a library created from google to profile the CPU.  The ruby implementation is curated by [Aman Gupta](https://github.com/tmm1/) and it's called perftools.rb, here you can find an old but still [concise and nice introduction](http://www.igvita.com/2009/06/13/profiling-ruby-with-googles-perftools/) by Ilya Grigorik.
Running this tool inside your code (or application, as we will see later), will interrupt your code for some milliseconds and extract a sample on a periodic interval, like a photoframe. These samples, that describe the current stack of the application at the moment that the 'picture' was token, are then put together in an output file.
As Ilya Grigorik point out, we can perform the profiling in two differents way:

- include the perftools library on the fly, specifying RUBYOPT(which tell ruby to turn on perftools) and CPUPROFILE(that specify where to sdave the output) before run the code. Ex:

{% highlight bash %}
CPUPROFILE=/tmp/script_to_test
RUBYOPT="-r`gem which perftools | tail -1`"
ruby script_to_test.rb
{% endhighlight bash %}

- require the perftoolr.rb library at the beginning of your programm

{% highlight ruby %}
require 'perftools'
require 'bigdecimal/math'
PerfTools::CpuProfiler.start("/tmp/pi") do
    BigMath.PI(10_000)
end
{% endhighlight ruby %}

#### Formats
In both cases, we define the output file where the results will be saved, in this case /tmp/pi. perftool.rb support different formats, like text:
{% highlight bash %}
pprof.rb --text /tmp/pi
{% endhighlight bash %}
Will outputs something like that
{% highlight bash %}
Total: 23 samples
      18  78.3%  78.3%       18  78.3% BigDecimal#div
       4  17.4%  95.7%        4  17.4% BigDecimal#*
       1   4.3% 100.0%       23 100.0% BigMath#PI
       0   0.0% 100.0%       23 100.0% BigMath.PI
{% endhighlight bash %}


23 is the number of samples collecting by perftools while the code was running. In 18 of them the cpu was executing BigDecimal#div, that takes the 78.3 of the total time, and as an
average CPU of 78.3%. A detailed lecture about how to read the output can be found [here](http://gperftools.googlecode.com/svn/trunk/doc/cpuprofile.html#pprof) 

like gif
{% highlight bash %}
pprof.rb --gif /tmp/pi > /tmp/pi.gif
{% endhighlight bash %}

Or using kcachegrind, that reads file in .callgrind format
{% highlight bash %}
pprof.rb ---callgrind /tmp/pi > /tmp/pi.callgrind
{% endhighlight bash %}

#### Perftools with Rails
There is a middleware for perftools.rb called [rack-perftools_profiler](https://github.com/bhb/rack-perftools_profiler). Following the readme file ypu can easily install the gem and configure the output format that you like in config/application.rb
Once the server is restarted, you can test a single request adding a parameter at the end of the URL, ex `http://localhost:3000/some_action?profile=true`

To profile multiple request, you can create a script that simulate this request, for example, using curl

{% highlight bash %}
curl http://localhost:3000/__start__
curl http://localhost:3000/an_action
curl http://localhost:3000/an_action_uh
curl http://localhost:3000/an_action_mah
curl http://localhost:3000/an_action
curl http://localhost:3000/__stop__
curl http://localhost:3000/__data__
{% endhighlight bash %}
The call to `__start__` will start the profiler, the calls to `an_action_*` are the requests that we want to test, and `__data__` will render in the browser the results of our test, in the format defined in config/application.rb

lista delle opzioni per rack-perftools (qui sotto)
lettura in dettaglio dei params



#### Rspec
http://labs.goclio.com/tuning-ruby-garbage-collection-for-rspec/



ruby-miniprofiler
http://miniprofiler.com/
http://samsaffron.com/archive/2013/03/19/flame-graphs-in-ruby-miniprofiler


ruby 2.1 http://tmm1.net/ruby21-profiling/
whats' new in the new GC http://tmm1.net/ruby21-profiling/

### Memory usage, use Memprof

debug, a complete overview about tools
http://www.slideshare.net/engine_yard/debugging-ruby

