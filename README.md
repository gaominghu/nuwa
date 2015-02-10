# nuwa

Agregate and deliver photos

## Install 

```
apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev curl build-essential graphicsmagick
curl https://install.meteor.com/ | sh
```

## Run

`meteor --settings settings.json`

## Details about configuration

nuwa is waiting for url in the form of : `http://url-01.local/folder/file.jpg`, it takes the photos number from the digits after the domain name.