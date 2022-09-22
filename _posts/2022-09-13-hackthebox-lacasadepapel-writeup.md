---
layout      : post
title       : "La Casa De Papel - HackTheBox"
author      : elc4br4
image       : lacasadepapel.webp
category    : [ htb ]
tags        : [ Linux ]
---

Vamos a resolver una máquina Linux Nivel Easy de HackTheBox en la que tendremos un proceso de explotación un poco largo y tedioso y unsa escalada rápida y sencilla para compensar, tocaremos PHP, crearemos certificados con OpenSSL, manejaremos claves rsa y acabaremos con una escalada muy sencilla💻👽👾

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/rating-lacasadepapel.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/al-lio.gif)


# Reconocimiento de puertos

Como siempre comenzamos lanzando nmap.

```nmap
PORT    STATE SERVICE
21/tcp  open  ftp
22/tcp  open  ssh
80/tcp  open  http
443/tcp open  https
```

A continuación procedo a realizar otro escaneo más detallado buscando servicios y versiones.

```nmap
PORT    STATE SERVICE  VERSION
21/tcp  open  ftp      vsftpd 2.3.4
22/tcp  open  ssh      OpenSSH 7.9 (protocol 2.0)
| ssh-hostkey: 
|   2048 03:e1:c2:c9:79:1c:a6:6b:51:34:8d:7a:c3:c7:c8:50 (RSA)
|   256 41:e4:95:a3:39:0b:25:f9:da:de:be:6a:dc:59:48:6d (ECDSA)
|_  256 30:0b:c6:66:2b:8f:5e:4f:26:28:75:0e:f5:b1:71:e4 (ED25519)
80/tcp  open  http     Node.js (Express middleware)
|_http-title: La Casa De Papel
443/tcp open  ssl/http Node.js Express framework
|_http-title: La Casa De Papel
| tls-nextprotoneg: 
|   http/1.1
|_  http/1.0
| ssl-cert: Subject: commonName=lacasadepapel.htb/organizationName=La Casa De Papel
| Not valid before: 2019-01-27T08:35:30
|_Not valid after:  2029-01-24T08:35:30
| tls-alpn: 
|_  http/1.1
|_ssl-date: TLS randomness does not represent time
Service Info: OS: Unix
```

Como podemos ver tenemos la siguiente información relevante:

| Puerto | Servicio | Versión |
| ------ | -------- | ------- |
| 21     | FTP      | vsftpd 2.3.4 | 
| 22     | SSH      | OpenSSH 7.9 |
| 80     | HTTP     | Node.js Express framework |
| 443    | HTTPS    | Node.js Express framework |


Además tenemos un vhost --> **lacasadepapel.htb**


Añadiremos el vhost al archivo /etc/hosts

A continuación voy a comprobar si la versión del servicio ftp es vulnerable, ya que no tenemos acceso anónimo ni credenciales.


![](/assets/images/HTB/LaCasaDePapel-Hackthebox/searchsploit.png)


Como vemos hay un exploit disponible en metasploit, configuro todo correctamente y ejecuto el exploit, pero me arroja un error...

`The service on port 6200 does not appear to be a shell`

Nos arroja ese error, nos dice que en el puerto 6200 no hay una shell y en el escaneo nmap no se nos ha reportado ese puerto.

Asique intento conectarme al puerto 6200 con netcat.

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/shellpsy.png)


Buscando información acerca de la Psy Shell encuentro que es una consola para desarrolladores en tiempo de ejecución, un depurador interactivo y REPL para php.

[https://psysh.org/](https://psysh.org/)

# Explotación

Podemos comprobar al escribir un comando lo siguiente --> `shell_exec() has been disabled for security reasons in phar://eval()'d code on line 1`

Pruebo a ejecutar otros comandos en php, como listar archivos o leer el contenido de los mismos.

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/shellpsy2.png)


Ahora consigo leer el archivo passwd, por lo tanto tenemos la posibilidad de movernos por los directorios, listar archivos y leer algunos.

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/shellpsy3.png)


![](/assets/images/HTB/LaCasaDePapel-Hackthebox/shellpsy4.png)


Tenemos varios usuarios, berlin, dali, nairobi, oslo y profesor

Tras enumerar en cada directorio encuentro una key en el directorio del usuario nairobi


![](/assets/images/HTB/LaCasaDePapel-Hackthebox/shellpsy5.png)


![](/assets/images/HTB/LaCasaDePapel-Hackthebox/shellpsy6.png)


Tenemos un certificado CA y debemos crear otro.

A continaución crearemos nuestro certificado usando openssl.

Creo un certificado x509 pasando la clave ca.key , usando cifrado sha256 durante 1024 días y lo sacamos al archivo elc4br4.pem 

```bash
❯ openssl req -x509 -new -nodes -key ca.key -sha256 -days 1024 -out elc4br4.pem
You are about to be asked to enter information that will be incorporated
into your certificate request.
What you are about to enter is what is called a Distinguished Name or a DN.
There are quite a few fields but you can leave some blank
For some fields there will be a default value,
If you enter '.', the field will be left blank.
-----
Country Name (2 letter code) [AU]:
State or Province Name (full name) [Some-State]:
Locality Name (eg, city) []:
Organization Name (eg, company) [Internet Widgits Pty Ltd]:La Casa De Papel
Organizational Unit Name (eg, section) []:
Common Name (e.g. server FQDN or YOUR name) []:lacasadepapel.htb
Email Address []:
```

Exportamos el archivo .pem a .p12

```bash
❯ openssl pkcs12 -export -in elc4br4.pem -inkey ca.key -out elc4br4.p12
Enter Export Password:
Verifying - Enter Export Password:
```
Ahora nos dirigimos a firefox, preferencias, buscamos certificados y le damos a ver certificados y click en Import y seleccionamos el archivo .p12

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/certificado2.png)


Una vez le damos okey volvemos a la web y nos saltará un pop up al que clickaremos en ok y se nos recargará la página y aparece los siguiente:

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/web1.png)
 
 Nos aparece Temporada 1 y Temporada 2 

Nos aparece lo siguiente al clickar en una de las temporadas.

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/web2.png)

Descargo el archivo pero no hay nada..., aunque en uno de ellos si que había data en base64, pero mo había nada de información de valor.

Asique pruebo a jugar con la ruta de la url, yendo hacia la raíz

`https://lacasadepapel.htb/?path=..`

Y aparece lo siguiente...

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/web3.png)


El problema es que no nos dejar clickar sobre los archivos para leerlos... asique debemos manipular la url para intentar leerlos...

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/web4.png)


Pero tampoco es posible leer los archivos, nos arroja un error... asique intentaré otra forma


![](/assets/images/HTB/LaCasaDePapel-Hackthebox/curl1.png)


Si pruebo de esta forma no funciona tampoco, probaré a encodearlo en base64, ya que en uno de los archivos .avi había data irrelevante en base64.

Lo encodeamos y como vemos FUNCIONA!!!

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/user.png)

Ya he obtenido la bandera user, a continuación probaré a leer el archivo rsa para intentar conectarme por ssh.

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/curl2.png)


Una vez lo tenemos nos conectamos por ssh probando con cada uno de los usuarios que encontramos anteriormente.

Consigo loguearme con el usuario professor

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/ssh.png)
![](/assets/images/HTB/LaCasaDePapel-Hackthebox/professor.gif)


# ESCALADA DE PRIVILEGIOS

En el directorio del usuario professor hay dos archivos.  

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/escalada1.png)


El script ejecuta el contenido del archivo memcached.ini, si lo modificamos podríamos conseguir escalar privilegios...

Creamos un nuevo archivo memcached.ini ya que no puedo modificarlo

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/escalada2.png)


Abrimos un oyente en netcat en el puerto 9999 y esperamos a recibir la conexión.

Y ya somos root!! 

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/root.png)

![](/assets/images/HTB/LaCasaDePapel-Hackthebox/denver.gif)
