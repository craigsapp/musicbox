
BINDIR = ../../../test/bin

jsonsvg:
	$(BINDIR)/svg2json *.svg > svg.json

timemap8i:
	$(BINDIR)/sv2json -i -s 0.5 *taps.txt > timemap-raw.json
	
timemapi:
	$(BINDIR)/sv2json -i *taps.txt > timemap-raw.json

timemap:
	$(BINDIR)/sv2json -b 2 *taps.txt > timemap-raw.json





