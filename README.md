# nuwa

Agregate and deliver photos

## Install 

```
apt-get install avahi-daemon avahi-discover libnss-mdns libavahi-compat-libdnssd-dev curl build-essential graphicsmagick
curl https://install.meteor.com/ | sh
```

Create a `temp` folder and a `projects/clients` folder at the root of meteor

## Run

`meteor --settings settings.json`

## Details about configuration

nuwa is waiting for url in the form of : `http://url-01.local/folder/file.jpg`, it takes the photos number from the digits after the domain name.



## Todo

[ ] Add bonjour as package
[x] Add compositing option settings