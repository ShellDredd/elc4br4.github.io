---
layout      : post
title       : "Shocker - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Shocker-HackTheBox/Shocker.webp
category    : [ htb ]
tags        : [ Linux ]
---

👨‍🎓Esta vez tenemos la máquina Shocker de nivel EASY, en la que explotaremos shellshock, veremos dos formas de detectarla y como explotarla, y finalizaremos con una escalada de privilegios sencilla a través del binario perl👨‍🎓

![](/assets/images/HTB/Shocker-HackTheBox/shocker2.webp)

![](/assets/images/HTB/Shocker-HackTheBox/shocker-rating.webp)

---
**Un pequeño INDIC**

1. [Reconocimiento](#reconocimiento)
    * [Reconocimiento de Puertos](#reconocimiento--reconocimiento)
2. [Enumeración](#Enumeración) 
    * [Enumeración Web](#enumeración--enumeración)
3. [Detección ShellShock](#detección-shellshock)    
    * [Metasploit](#metasploit-metasploit-metasploit)
    * [Nmap](#nmap-nmap-nmap)
4. [Explotación ShellShock](#Explotación-ShellShock)    
    * [Burpsuite](#burpsuite-burpsuite-burpsuite)
 5. [Escalada de Privilegios](#escalada-de-privilegios) 
    * [Perl](#perl-perl-perl)    


# Reconocimiento [#](Reconocimiento) {#Reconocimiento}

## Reconocimiento de Puertos [📌](#Reconocimiento de Puertos) {#Reconocimiento de Puertos}

Como siempre comenzamos lanzando la utilidad Whichsystem para saber ante que sistema operativo nos enfrentamos.

![](/assets/images/HTB/Shocker-HackTheBox/whichsystem.webp)

Una vez que sabemos que estamos ante una máquina `Linux` ya comienzo a escanear puertos y servicios.

![](/assets/images/HTB/Shocker-HackTheBox/rustscan.webp)

> Están abiertos los puertos 80 y 2222 en el sistema.

Lanzo el escaneo de servicios y versiones para obtener más información de los puertos 22 y 2222.

```nmap
PORT     STATE SERVICE REASON  VERSION
80/tcp   open  http    syn-ack Apache httpd 2.4.18 ((Ubuntu))
| http-methods: 
|_  Supported Methods: GET HEAD POST OPTIONS
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
2222/tcp open  ssh     syn-ack OpenSSH 7.2p2 Ubuntu 4ubuntu2.2 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 c4:f8:ad:e8:f8:04:77:de:cf:15:0d:63:0a:18:7e:49 (RSA)
| ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQD8ArTOHWzqhwcyAZWc2CmxfLmVVTwfLZf0zhCBREGCpS2WC3NhAKQ2zefCHCU8XTC8hY9ta5ocU+p7S52OGHlaG7HuA5Xlnihl1INNsMX7gpNcfQEYnyby+hjHWPLo4++fAyO/lB8NammyA13MzvJy8pxvB9gmCJhVPaFzG5yX6Ly8OIsvVDk+qVa5eLCIua1E7WGACUlmkEGljDvzOaBdogMQZ8TGBTqNZbShnFH1WsUxBtJNRtYfeeGjztKTQqqj4WD5atU8dqV/iwmTylpE7wdHZ+38ckuYL9dmUPLh4Li2ZgdY6XniVOBGthY5a2uJ2OFp2xe1WS9KvbYjJ/tH
|   256 22:8f:b1:97:bf:0f:17:08:fc:7e:2c:8f:e9:77:3a:48 (ECDSA)
| ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBPiFJd2F35NPKIQxKMHrgPzVzoNHOJtTtM+zlwVfxzvcXPFFuQrOL7X6Mi9YQF9QRVJpwtmV9KAtWltmk3qm4oc=
|   256 e6:ac:27:a3:b5:a9:f1:12:3c:34:a5:5d:5b:eb:3d:e9 (ED25519)
|_ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIC/RjKhT/2YPlCgFQLx+gOXhC6W3A3raTzjlXQMT8Msk
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
| Puerto | Servicio | Versión |
| :----- | :------- | :------ |
| 2222   | SSH      | OpenSSH 7.2p2 |
| 80     | HTTP     | Apache 2.4.18 |

De momento no veo nada relevante, asique habría que empezar a darle caña al puerto 80 enumerando el servidor web.

# Enumeración [#](Enumeración) {#Enumeración}

## Enumeración Web [📌](#Enumeración Web) {#Enumeración Web}

Abro el navegador para ver que tenemos en el servidor web.

Al acceder a la ip vemos lo siguiente:

![](/assets/images/HTB/Shocker-HackTheBox/web1.webp)

Inspecciono el código fuente pero no hay nada que pueda servirme.

Antes de proceder a fuzzear rutas decido lanzar la herramienta `nikto` para escanear vulnerabilidades y sacar info más detallada del servidor web.

![](/assets/images/HTB/Shocker-HackTheBox/nikto.webp)

Pero `nikto` no me arroja ninguna información valiosa.

Llegados a este punto procedo a `fuzzear rutas` en el servidor.

![](/assets/images/HTB/Shocker-HackTheBox/feroxbuster.webp)

Encontramos la ruta `cgi-bin`... que me hace pensar que este servidor podría ser vulnerable a `shellshock`, pero antes hay que comprobarlo.

Buscando información al respecto encuentro esto.

[https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/cgi](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/cgi)

![](/assets/images/HTB/Shocker-HackTheBox/web2.webp)

Nos dice que bash se puede usar para ejecutar comandos que le pasan las aplicaciones.

Por lo tanto podría buscar algún archivo con extensión `.sh dentro de la ruta cgi-bin`.

Asique procedo a fuzzear pero probando varias extensiones por si acaso, ya que bash no es la única extensión que podemos encontrar.

![](/assets/images/HTB/Shocker-HackTheBox/feroxbuster1.webp)

Encontramos el archivo `user.sh` por lo tanto ya podríamos comprobar si es vulnerable, para comprobarlo existen varias formas, pero yo solo mostraré dos de ellas, una a través de metasploit y otra a través de nmap.

# Detección ShellShock [👿](Detección ShellShock) {#Detección ShellShock}

## Metasploit (#Metasploit) {#Metasploit}

Abrimos metasploit y usamos el módulo auxiliar: 

> scanner/http/apache_mod_cgi_bash_env

Configuramos las opciones que nos pide el módulo.

```msfconsole
msf6 auxiliary(scanner/http/apache_mod_cgi_bash_env) > set RHOST 10.10.10.56
RHOST => 10.10.10.56
msf6 auxiliary(scanner/http/apache_mod_cgi_bash_env) > set TARGETURI /cgi-bin/user.sh
TARGETURI => /cgi-bin/user.sh
```
Y lo ejecutamos

![](/assets/images/HTB/Shocker-HackTheBox/metasploit.webp)

Y como vemos, es `vulnerable a ShellShock`.

## Nmap (#Nmap) {#Nmap}

Para detectar si es vulnerable a través de nmap, usaremos un `script` que ya trae el propio nmap.

![](/assets/images/HTB/Shocker-HackTheBox/shellshock.webp)

> /usr/share/nmap/scripts/http-shellshock.nse

Y a través de este comando comprobamos si es vulnerable o no.

**`nmap -p 80 10.10.10.56 --script=/usr/share/nmap/scripts/http-shellshock.nse --script-args uri=/cgi-bin/user.sh`**

![](/assets/images/HTB/Shocker-HackTheBox/nmap.webp)

Y como vemos es `Vulnerable a ShellShock`.

# Explotación ShellShock [👿](Explotación ShellShock) {#Explotación ShellShock}

## Burpsuite (#Burpsuite) {#Burpsuite}

Una vez hemos detectado que es vulnerable procedo a su explotación para acceder al sistema.

En este caso, en vez de usar metasploit voy a explotarlo a través de `burpsuite`.

`Modificando el user agent podemos introducir comandos`.

De forma que primeramente hago un ping a la ip de mi interfaz tun0 (la vpn de HTB).

![](/assets/images/HTB/Shocker-HackTheBox/burp1.webp)

Como se puede ver en la imágen, el comando se ejecuta perfectamente y hace ping a la ip.

A continuación intento entablar una `conexión inversa` con una `rev shell en bash`.

![](/assets/images/HTB/Shocker-HackTheBox/burp2.webp)

Y como vemos, hay conexión.

![](/assets/images/HTB/Shocker-HackTheBox/nc.webp)

Una vez dentro ya podemos leer la flag `user.txt`

![](/assets/images/HTB/Shocker-HackTheBox/user.webp)

Y ahora toca `escalar privilegios`.

# Escalada de Privilegios [👨‍💻](Escalada de Privilegios) {#Escalada de Privilegios}

## Perl (#Perl) {#Perl}

Como siempre comenzamos enumerando el sistema en busca de `vectores de escalada`.

Yo siempre comienzo con `sudo -l` asique esta vez no va a ser menos.

![](/assets/images/HTB/Shocker-HackTheBox/sudo.webp)

Podemos ejecutar `como el usuario root sin contraseña` el binario `perl`.

Y como de costumbre, nos dirigimos a la web `GTFOBINS`

[https://gtfobins.github.io/gtfobins/perl/](https://gtfobins.github.io/gtfobins/perl/) 

Ejecutamos el comando:

>`sudo perl -e 'exec "/bin/sh";'`

![](/assets/images/HTB/Shocker-HackTheBox/root.webp)

Y ya somos root y podemos leer la flag `root.txt`

![](/assets/images/HTB/Shocker-HackTheBox/root2.webp)

