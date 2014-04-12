---
layout: post
title: "How to get the prime factors of a number in Golang"
category: 
tags: [Golang, concurrency, prime numbers]
---

 Learning golang, i'm writing a program that reads the images in a folder and composes a grid of thumbs out of them. The first problem was how to calculate how many thumbs fit a rectangle. in order to do that i need to compose the total number of the images in prime factors. In the go source code you can find an example about [how to produce a list of prime numbers](http://play.golang.org/p/9U22NfrXeq).
 What was missing in that example, was the capacity to declare a limit, that corresponds to the number that i have to factorize. The solution was to use a channel as a signal, that sends a message to the other goroutine when the limit is reached.
 Here the complete code with an example.

{% highlight go %}

// Prime factorization derived from slightly modified version
// of sieve.go in Go source distribution.
package main

import (
    "fmt"
)
// Generate numbers until the limit max.
// after the 2, all the prime numbers are odd
// Send a channel signal when the limit is reached
func Generate(max int, ch chan<- int) {
    ch <- 2
    for i := 3; i <= max; i += 2 {
        ch <- i
    }
    ch <- -1 // signal that the limit is reached
}

// Copy the values from channel 'in' to channel 'out',
// removing those divisible by 'prime'.
func Filter(in <-chan int, out chan<- int, prime int) {
    for i := <-in; i != -1; i = <-in {
        if i%prime != 0 {
            out <- i
        }
    }
    out <- -1
}

func CalcPrimeFactors(number_to_factorize int) []int {
    rv := []int{}
    ch := make(chan int)
    go Generate(number_to_factorize, ch)
    for prime := <-ch; (prime != -1) && (number_to_factorize > 1); prime = <-ch {
        for number_to_factorize%prime == 0 {
            number_to_factorize = number_to_factorize / prime
            rv = append(rv, prime)
        }
        ch1 := make(chan int)
        go Filter(ch, ch1, prime)
        ch = ch1
    }
    return rv
}

func main() {
    fmt.Println(CalcPrimeFactors(699))
    fmt.Println(CalcPrimeFactors(1233))
    fmt.Println(CalcPrimeFactors(9876))
}
{% endhighlight go %}
