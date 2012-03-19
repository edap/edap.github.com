#/bin/bash
for file in *.html
do
	perl -p -i -e 's/\[ruby\]/\{\% highlight ruby \%\}/g' "$file"
	perl -p -i -e 's/\[\/ruby\]/\{\% endhighlight \%\}/g' "$file"
	perl -p -i -e 's/\[php\]/\{\% highlight php startinline \%\}/g' "$file"
	perl -p -i -e 's/\[\/php\]/\{\% endhighlight \%\}/g' "$file"
	#perl -p -i -e 's/\[bash\]/\{\% highlight bash \%\}/g' "$file"
	#perl -p -i -e 's/\[\/bash\]/\{\% endhighlight \%\}/g' "$file"
	#perl -p -i -e 's/\&lt;/::/g' "$file"
	#perl -p -i -e 's/\r\n$/\n/g' "$file"
done
