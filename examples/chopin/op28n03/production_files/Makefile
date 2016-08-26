##
## Programmer:    Craig Stuart Sapp <craig@ccrma.stanford.edu>
## Creation Date: Mon May  4 11:12:32 PDT 2015
## Last Modified: Fri May  8 21:49:59 PDT 2015
## Filename:      Makefile
## Syntax:        GNU makefile
##
# Program requirements:
#
# bboxpad    == scorelib/scripts/perl/bboxpad
#               Add buffer space inside BoundingBox.
# embedpmx   == scorelib/scripts/perl/uniqsvgids
#               Places source PMX data inside SVG files.
# svgscale   == scorelib/scripts/perl/svgscale
#               Resize SVG images (created by seps2svg in particular).
# uniqsvgids == scorelib/scripts/perl/uniqsvgids
#               Make unique IDs in SVG images made by seps2svg.
# webscore-insert == scorelib/scripts/perl/webscore-insert
#               Insert SVG code comments in EPS files from 
#               side-channel files (*.txt).
# webscore   == scorelib/src-programs/webscore.cpp
#               Add timestamps to score and chop into systems.
# seps2svg   == https://github.com/th-we/seps2svg
#               Convert SCORE EPS files into SVG files.
#

PPMX = chopin-op28n03.ppmx

all:
	@echo "make pre     == Create PMX and Replacement files."
	@echo "make eps     == Download raw EPS files."
	@echo "make post    == Prepare SVG images after EPS files created."
	@echo "make install == Copy SVG images to target directory."
	@echo "make clean   == Clean easily regenerated files."

# Installation directory (where SVG images should be copied):
IDIR=../

rebuild: pre post

pre: init
init: pmxinit replaceinit

eps:
	for i in *.pmx; do geteps $$i > `basename $$i .pmx`.eps-raw; \
		echo $$i; done

post: insert pad svg scale embed uniq

install:
	cp -f *.svg $(IDIR)

clean:
	-rm *.pmx  # created with "make pre"
	-rm *.txt  # created with "make pre"
	-rm *.eps  # created with "make post"
	-rm *.svg  # created with "make post"
	# *.eps-raw are time-consuming to generate, so don't delete

superclean: clean
	-rm *.eps-raw


##############################

replace: replaceinit
replaceinit:
	webscore -r $(PPMX) | ppmxsplit -Ox txt

pmx: pmxinit
pmxinit:
	webscore -a $(PPMX) | ppmxsplit -O

##############################

# Replace note serial number markers with SVG code:
insert:
	for i in *.eps-raw; do webscore-insert $$i `basename $$i .eps-raw`.txt > `basename $$i .eps-raw`.eps; echo $$i; done

# Add a little space inside bounding box to avoid clipping 
# from font substitution:
pad:
	for i in *.eps; do bboxpad $$i > $$i.x && mv $$i.x $$i; echo $$i; done
	
# Create SVG images from EPS files:
svg:
	for i in *.eps; do seps2svg $$i; echo $$i; done

# Increase scale of SVG images by 1.5 times:
scale:
	for i in *.svg; do svgscale $$i > $$i.x; mv -f $$i.x $$i; echo $$i; done
	
# Store original PMX data in SVG files as Processor Instruction:
embed:
	for i in *.svg; do embedpmx $$i `basename $$i .svg`.pmx; echo $$i; done

# Make unique font IDs amongst all SVG images:
uniq:
	uniqsvgids *.svg;



