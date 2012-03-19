#/bin/bash
	perl -p -i -e 's/\[ruby\]/\{\% highlight ruby \%\}/g' "2011-12-02-aggiungere-una-action-ad-un-controller-in-rails3.html"
	perl -p -i -e 's/\[\/ruby\]/\{\% endhighlight \%\}/g' "2011-12-02-aggiungere-una-action-ad-un-controller-in-rails3.html"
	#perl -p -i -e 's/\[php\]/\{\% highlight php startinline \%\}/g' "$file"
	#perl -p -i -e 's/\[\/php\]/\{\% endhighlight \%\}/g' "$file"
	#perl -p -i -e 's/\[bash\]/\{\% highlight bash \%\}/g' "$file"
	#perl -p -i -e 's/\[\/bash\]/\{\% endhighlight \%\}/g' "$file"
	#perl -p -i -e 's/\&lt;/::/g' "$file"
	#perl -p -i -e 's/\r\n$/\n/g' "$file"


