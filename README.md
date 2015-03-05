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
