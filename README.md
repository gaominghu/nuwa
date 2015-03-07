# nuwa

Agregate and deliver photos

## Install

```
apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev curl build-essential graphicsmagick
curl https://install.meteor.com/ | sh
```

Create a `temp` folder and a `projects/clients` folder at the root of meteor
```
$ mkdir temp
$ mkdir -p projects/clients
```
and put your client folder
```
$ cp -r /path/to/myclientfolder projects/clients
```

## Install ffmpeg
as mentioned on the official [ffmpeg distrib website](http://www.deb-multimedia.org/)

```
$ wget http://www.deb-multimedia.org/pool/main/d/deb-multimedia-keyring/deb-multimedia-keyring_2014.2_all.deb
$ sudo dpkg -i deb-multimedia-keyring_2014.2_all.deb
$ sudo apt-get update
$ sudo apt-get install deb-multimedia-keyring
$ sudo apt-get install ffmpeg x264
```

If you're running Ubuntu 14.10, use:

```
$ sudo add-apt-repository ppa:kirillshkrogalev/ffmpeg-next
$ sudo apt-get update
$ sudo apt-get install ffmpeg x264
```

If you want to have fun :
```
$ apt-get install build-essential subversion git-core yasm libgpac-dev libdirac-dev libgsm1-dev libschroedinger-dev libspeex-dev libvorbis-dev libopenjpeg-dev libdc1394-22-dev libsdl1.2-dev zlib1g-dev texi2html libfaac-dev libfaad-dev libmp3lame-dev libtheora-dev libopencore-amrnb-dev libopencore-amrwb-dev libvpx-dev libfreetype6-dev frei0r-plugins-dev librtmp-dev  libx264-dev libavdevice-dev libavfilter-dev libavformat-dev libavutil-dev
$ git clone git://git.videolan.org/x264.git
$ cd x264 && ./configure --enable-shared
$ make && sudo make install
$ sudo apt-get install yasm
$ git clone git://source.ffmpeg.org/ffmpeg.git
$ cd ffmpeg/ && git checkout n2.5.4
$ ./configure --enable-shared --enable-libx264 --enable-gpl
$ make && sudo make install
$ make tools/qt-faststart
$ sudo make install tools/qt-faststart
$ cd ../x264 && make distclean
$ ./configure --enable-static
$ make && sudo make install
$ sudo ldconfig


```




## Run

`meteor --settings settings.json`

## Details about configuration

nuwa is waiting for url in the form of : `http://url-01.local/folder/file.jpg`, it takes the photos number from the digits after the domain name.



## Todo

[ ] Add bonjour as package
[x] Add compositing option settings

## FFmpeg test command

In a folder with images 0001.jpg, 0002.jpg, ...
```
ffmpeg -framerate 10 -i %04d.jpg -c:v libx264 -pix_fmt yuv420p out.mp4
```

If you have missing files, you'd better use
```
ffmpeg -framerate 10 -pattern_type glob -i "*.jpg" -c:v libx264 -pix_fmt yuv420p out.mp4
```
