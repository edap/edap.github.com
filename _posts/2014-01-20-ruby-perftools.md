---
layout: post
title: "ruby perftools"
category:
tags: [perftools, ruby]
draft: true
---

== Debug
A lot of things at differents levels can go wrong developing ruby code. We need tools to test networks, OS calls, code, CPU usage and memory usage. This article will focus on the latest 2

=== CPU usage, use perftools
Perftools is a library created from google to profile the CPU.  The ruby implementation is curated by [https://github.com/tmm1/](Aman Gupta) and it's called perftools.rb, here you can find an old but still [http://www.igvita.com/2009/06/13/profiling-ruby-with-googles-perftools/](coincise and nice introduction) by Ilya Grigorik.
Running this tool inside your code (or application, as we will see later), will interrupt your code for some milliseconds and extract a sample on a periodic interval, like a photoframe. This samples, that describe the current stack of the application at the moment the 'picture' was token, are then put together in an output file. 
As Ilya Grigorik point out, we can perform the profiling in two differents way:
 
* include the perftools library on the fly, specifying RUBYOPT(which tell ruby to turn on perftools) and CPUPROFILE(that specify where to sdave the output) before run the code. Ex
CPUPROFILE=/tmp/script_to_test 
RUBYOPT="-r`gem which perftools | tail -1`"
ruby script_to_test.rb

* require the perftoolr.rb library at the beginning of your programm 

{% highlight ruby %}
require 'perftools'
require 'bigdecimal/math'
PerfTools::CpuProfiler.start("/tmp/pi") do
    BigMath.PI(10_000)
end
{% endhighlight ruby %}

==== Formats
The output file will be saved in /tmp/pi, as we have specified. It can be read in differents file formats:
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
average CPU of 78.3%. A detailed lecture about how to read the output can be found [http://gperftools.googlecode.com/svn/trunk/doc/cpuprofile.html#pprof](here) 

We can read this information in differents format, like gif
{% highlight bash %}
pprof.rb --gif /tmp/pi > /tmp/pi.gif
{% endhighlight bash %}

Or using kcachegrind, that reads file in .callgrind format
{% highlight bash %}
pprof.rb ---callgrind /tmp/pi > /tmp/pi.callgrind
{% endhighlight bash %}

==== Rails

2 tools
rack-perftools_profiler
http://spin.atomicobject.com/2011/03/15/identifying-a-rails-3-0-5-performance-problem-with-perftools-rb/
https://github.com/bhb/rack-perftools_profiler

Install the gem and configure the output format that you like in config/application.rb

===== Single page test
Open the browser on http://localhost:3000/some_action?profile=true


==== Rspec
http://labs.goclio.com/tuning-ruby-garbage-collection-for-rspec/



ruby-miniprofiler
http://miniprofiler.com/
http://samsaffron.com/archive/2013/03/19/flame-graphs-in-ruby-miniprofiler


ruby 2.1 http://tmm1.net/ruby21-profiling/
whats' new in the new GC http://tmm1.net/ruby21-profiling/

=== Memory usage, use Memprof

debug, a complete overview about tools
http://www.slideshare.net/engine_yard/debugging-ruby

