---
layout: post
title: "ruby perftools"
category:
tags: [perftools, ruby, profiling, cpu profiling]
---

### CPU usage, use perftools
Perftools is a library created from google to profile the CPU.  The ruby implementation is curated by [Aman Gupta](https://github.com/tmm1/) and it's called perftools.rb, here you can find an old but still [concise and nice introduction](http://www.igvita.com/2009/06/13/profiling-ruby-with-googles-perftools/) by Ilya Grigorik.
Running this tool inside your code (or application, as we will see later), will interrupt your code for some milliseconds and extract a sample on a periodic interval, like a photoframe. These samples, that describe the current stack of the application at the moment that the 'picture' was token, are then put together in an output file.
As Ilya Grigorik point out, we can perform the profiling in two differents way:

- include the perftools library on the fly, specifying RUBYOPT(which tells ruby to turn on perftools) and CPUPROFILE(that specifies where to save the output) before run the code. Ex:

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
or gif
{% highlight bash %}
pprof.rb --gif /tmp/pi > /tmp/pi.gif
{% endhighlight bash %}

Or in .callgrind format, that can be later opened with kcachegrind
{% highlight bash %}
pprof.rb ---callgrind /tmp/pi > /tmp/pi.callgrind
{% endhighlight bash %}

#### Reading the output
The first example `pprof.rb --text /tmp/pi`, will output something like that
{% highlight bash %}
Total: 23 samples
      18  78.3%  78.3%       18  78.3% BigDecimal#div
       4  17.4%  95.7%        4  17.4% BigDecimal#*
       1   4.3% 100.0%       23 100.0% BigMath#PI
       0   0.0% 100.0%       23 100.0% BigMath.PI
{% endhighlight bash %}

Let's start analyzing the first row from left to right:
* 23 is the number of samples collecting by perftools while the code was running.
* In 18 of them, the cpu was executing BigDecimal#div
* that is, in percent, the 78.3% of the whole time
* So far, the 78,3 of the samples was printed out.
* 18 samples are contained in this method(BigDecimal#div) and its callees
* The name of the method
A detailed lecture about how to read the output can be found [here](http://gperftools.googlecode.com/svn/trunk/doc/cpuprofile.html#pprof)


#### Perftools with Rails
There is a middleware for perftools.rb called [rack-perftools_profiler](https://github.com/bhb/rack-perftools_profiler). Following the readme file you can easily install the gem and configure the output format that you prefer in config/application.rb
Once the server is restarted, you can:

* Profile a single request adding a parameter at the end of the URL, ex `http://localhost:3000/some_action?profile=true`

* Profile multiple request with different URLs, creating a script that simulate this request, for example, using curl
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

* or you can profile multiple request that has the same URL, always with curl, appending the `times` options at the end of the:
`curl http://localhost:3000/foobar?profile=true&times=3`
The option directly added in the call overwrites that defined in config/application.rb. Other interesting options are `frequency` and `mode`, have a look here for more information [options in rack-perftools_profiler](https://github.com/bhb/rack-perftools_profiler#options)

#### Rspec
It is possible to profile the test suite adding this to your spec_helper, [via StackOverflow](http://stackoverflow.com/questions/9680481/how-to-profile-rspec-with-perftools-and-bundler)
{% highlight ruby %}
config.before :suite do
  PerfTools::CpuProfiler.start("/tmp/rspec_profile")
end

config.after :suite do
  PerfTools::CpuProfiler.stop
end
{% endhighlight ruby %}

Or enabling the profiler before start the rspec suite:
`CPUPROFILE=/tmp/prof CPUPROFILE_REALTIME=1 time rspec spec/`