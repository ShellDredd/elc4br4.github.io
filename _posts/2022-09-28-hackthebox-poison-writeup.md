---
layout      : post
title       : "Poison - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Poison-HackTheBox/Poison.webp
category    : [ htb ]
tags        : [ FreeBSD ]
---

En esta ocasión estaré resolviendo una máquina de nivel MEDIUM de HackTheBox en la que tendremos que explotar la vulnerabilidad Directory Path Transversal y a través de procesos en ejecución encontraremos el servicio VNC y tendremos que crear un Túnel ssh para acceder al mismo.

![](/assets/images/HTB/Poison-HackTheBox/Poison2.png)


![](/assets/images/HTB/Poison-HackTheBox/Poison-rating.webp)

# Reconocimiento de Puertos

```nmap
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

Tenemos el puerto 22 (ssh) y el puertto 80 (http)

Escaneo un poco más a fondo para encontrar más información al respecto.

```nmap
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.2 (FreeBSD 20161230; protocol 2.0)
| ssh-hostkey: 
|   2048 e3:3b:7d:3c:8f:4b:8c:f9:cd:7f:d2:3a:ce:2d:ff:bb (RSA)
|   256 4c:e8:c6:02:bd:fc:83:ff:c9:80:01:54:7d:22:81:72 (ECDSA)
|_  256 0b:8f:d5:71:85:90:13:85:61:8b:eb:34:13:5f:94:3b (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((FreeBSD) PHP/5.6.32)
|_http-server-header: Apache/2.4.29 (FreeBSD) PHP/5.6.32
|_http-title: Site doesn't have a title (text/html; charset=UTF-8).
Service Info: OS: FreeBSD; CPE: cpe:/o:freebsd:freebsd
```

# Enumeración Web 

Al acceder desde el navegador para revisar el servidor web vemos lo siguiente:

![](/assets/images/HTB/Poison-HackTheBox/web1.webp)

Si añadimos en el campo el parámetro listfiles.php

![](/assets/images/HTB/Poison-HackTheBox/web2.webp)

Podemos ver que hay un archivo llamado pwdbackup.txt

![](/assets/images/HTB/Poison-HackTheBox/web3.webp)

En el hay una contraseña encodeada en base64 13 veces.

Tras decodear la cadena base64 13 veces encontramos la contraseña.

> Charix!2#4%6&8(0 

Tenemos una contraseña pero aún nos falta un usuario, asique al ver que en el servidor web tenemos muchos archivos .php procedo a comprobar si podría existir alguna vulnerabilidad LFI o Directory Transversal.

A través de un diccionario y la herramienta wfuzz compruebo si existe alguna de estas vulnerabilidades.

> `wfuzz -c -w /usr/share/payloadsallthethings/"Directory Traversal"/Intruder/dotdotpwn.txt -u 'http://10.10.10.84/browse.php?file=FUZZ' --hl=4,2`

![](/assets/images/HTB/Poison-HackTheBox/wfuzz.webp)

Todas esas rutas podríamos usar para leer el archivo passwd.

![](/assets/images/HTB/Poison-HackTheBox/passwd.webp)

Tenemos el usuario Charix y su contraseña.

> Charix:Charix!2#4%6&8(0

Ahora intento loguearme con esas credenciales a través de ssh para obtener acceso al sistema.

# Sesión SSH

Una vez nos logueamos podemos leer la flag user.txt 

![](/assets/images/HTB/Poison-HackTheBox/user.webp)

# Escalada de Privilegios

Ahora toca escalar privilegios para leer la flag root.txt

En el directorio de usuario de Charix tenemos un archivo llamado secret.zip

Nos lo descargamos a nuestra máquina atacante

```bash
❯ scp charix@10.10.10.84:/home/charix/secret.zip .
Password for charix@Poison:
secret.zip
```
Y lo descomprimimos usando la contraseña que usamos para conectarnos por ssh (Charix!2#4%6&8(0)

![](/assets/images/HTB/Poison-HackTheBox/secret.webp)

Tenemos caracteres no legibles, lo que me hace pensar que estoy yendo por el camino equivocado.

Dejo a un lado el archivo y enumero más vectores de escalada.

Miro los procesos existentes en ejecución con el comando `ps aux`

> `root   529   0.0  0.9  23620  8872 v0- I    22:34    0:00.02 Xvnc :1 -desktop X -httpd /usr/local/share/tightvnc/classes -auth /root/.Xauthority -geometry 1280x800 -d`

```netstat
charix@Poison:~ % netstat -an
Active Internet connections (including servers)
Proto Recv-Q Send-Q Local Address          Foreign Address        (state)
tcp4       0      0 10.10.10.84.22         10.10.14.3.54562       ESTABLISHED
tcp4       0      0 127.0.0.1.25           *.*                    LISTEN
tcp4       0      0 *.80                   *.*                    LISTEN
tcp6       0      0 *.80                   *.*                    LISTEN
tcp4       0      0 *.22                   *.*                    LISTEN
tcp6       0      0 *.22                   *.*                    LISTEN
tcp4       0      0 127.0.0.1.5801         *.*                    LISTEN
tcp4       0      0 127.0.0.1.5901         *.*                    LISTEN
udp4       0      0 *.514                  *.*                    
udp6       0      0 *.514                  *.*                    
Active UNIX domain sockets
```

Tenemos el servicio VNC activo en el puerto 5901, asique para poder conectarme he de crear un tunel a través de ssh.

Para crear el túnel:

> `ssh -L 5901:127.0.0.1:5901 charix@10.10.10.84`

Una vez creado ya puedo conectarme al servicio VNC a través de la herramienta vncviewer.

Podéis descargar la herramienta VNCViewer desde aquí [https://www.realvnc.com/es/connect/download/viewer/linux/](https://www.realvnc.com/es/connect/download/viewer/linux/)

Lo descargo e intento conectarme pero me pide una contraseña, pruebo con la del usuario Charix pero no funciona.

Pruebo introduciendo los datos del archivo secret que unzipeamos pero nada, asique se me ocurre probar con secret (el nombre del archivo).

Pero tampoco hay suerte... asique intento decodificar el contenido del archivo secret.

Encuentro esta herramienta [https://github.com/trinitronx/vncpasswd.py](https://github.com/trinitronx/vncpasswd.py) 

La consigo decodificar

```vncpass
❯ python2 vncpasswd.py -d -f /home/elc4br4/secret
Decrypted Bin Pass= 'VNCP@$$!'
Decrypted Hex Pass= '564e435040242421'
```

Y ya puedo conectarme.

> `vncviewer 127.0.0.1:5901 -passwd VNCP@$$!`

![](/assets/images/HTB/Poison-HackTheBox/vnc.webp)

