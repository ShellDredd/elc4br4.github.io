---
layout      : post
title       : "Rei - HackMyVm"
author      : elc4br4
image       : assets/images/HMV/Rei-HackMyVM/Rei.webp
category    : [ HackMyVM ]
tags        : [ Linux ]
---

En esta ocasión tenemos una máquina nivel Easy creada por ShellDredd, tendremos varios trolleos a lo largo de la explotación y debemos fijarnos y prestar atención a todo.

Canal Shelldredd Informática [https://www.youtube.com/c/ShellDreddInform%C3%A1tica](https://www.youtube.com/c/ShellDreddInform%C3%A1tica)

# Reconocimiento de Puertos

Comenzamos lanzando nmap para descubrir los puertos abiertos en la máquina.

```nmap
PORT      STATE SERVICE
63777/tcp open  unknown
65333/tcp open  unknown
```

Me saca 2 puertos, pero no tengo ni idea de que se ejecuta en los mismos de forma que voy a realizar un escaneo más descriptivo para obtener los servicios que se ejecutan en cada puerto y sus versiones.

```nmap
PORT      STATE SERVICE VERSION
63777/tcp open  http    lighttpd 1.4.59
|_http-server-header: lighttpd/1.4.59
|_http-title: Welcome page
65333/tcp open  ssh     OpenSSH 8.4p1 Debian 5 (protocol 2.0)
| ssh-hostkey: 
|   3072 25:62:b8:14:da:7d:e9:ea:48:4c:a9:31:08:cd:c5:78 (RSA)
|   256 b8:51:f8:62:de:16:09:d0:f9:a8:2c:c3:3b:09:a1:e3 (ECDSA)
|_  256 f4:f5:6c:ac:81:ed:06:14:ea:07:de:56:ac:34:ca:be (ED25519)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```
Una vez finalizado el escaneo ya tengo la información que necesitaba:

| Puerto | Servicio | Versión |
| ------ | -------- | ------- |
| 63777  | http     | lighttpd 1.4.59 |
| 65333  | ssh      | OpenSSH 8.4p1 Debian 5 |


>Tenemos un servidor web en el puerto 63777 
>ssh en el 65333

# Enumeración Web

A simple vista no hay nada relevante o de interés que me pueda servir

![](/assets/images/HMV/Rei-HackMyVM/web1.webp)


Reviso el código fuente y tampoco hay nada.

>Toca fuzzear para descubrir rutas en el servidor.

En esta ocasión uso gobuster bajo el comando:

`gobuster dir -u http://192.168.0.13:63777 -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,txt`

![](/assets/images/HMV/Rei-HackMyVM/gobuster.webp)

Encuentro el robots.txt pero no hay nada...

![](/assets/images/HMV/Rei-HackMyVM/robots.webp)

Tras seguir buscando no encontraba nada asique decidí volver al principio porque me estaba dejando algo...

Me di cuenta tras un buen rato de búsqueda...

Si te fijas en la documentación que hay en la primera foto nada más acceder al servidor web verás la siguiente línea:

> Additional documentation can be found at"text" archive: indexp in the default directory /var/www/html/.

Asique pruebo con la ruta `http://192.168.0.13:63777/indexp.txt`

Me saca un montón de rutas `Disallow` pero varias `Allow`

![](/assets/images/HMV/Rei-HackMyVM/rutas.webp)

Fui vistando cada ruta una a una y todas me daban error 404.

> Excepto la ruta /gichin/your-button que me daba código 403 (Forbidden) al acceder.

De forma que sigo fuzzeando desde esa ruta.

`gobuster dir -u http://192.168.0.13:63777/gichin/your-button -w /usr/share/wordlists/dirbuster/directory-list-2.3-medium.txt -x php,html,txt`

![](/assets/images/HMV/Rei-HackMyVM/gobuster2.webp)

Y me saca dos rutas: 
* note.html 
* ssh

![](/assets/images/HMV/Rei-HackMyVM/karate.webp)

Simplemente hay un gif, pero miro el código fuente y encuentro la siguiente línea:

>title="ENTER" href="chuck-norris.html"

Tenemos una imágen... Y encontramos algo más

![](/assets/images/HMV/Rei-HackMyVM/chucknorris.webp)

Pero hay que fijarse en todo, ya que la foto nos da varios datos interesantes...

>BALANCE IS KEY

>Chuck Norris is the user master

![](/assets/images/HMV/Rei-HackMyVM/balance.gif)

Podríamos estar ante un usuario y una posible contraseña... Asique porque no probar?

![](/assets/images/HMV/Rei-HackMyVM/karate1.gif)

# SSH 

Nos intentamos loguear con los datos que tenemos por ssh.

![](/assets/images/HMV/Rei-HackMyVM/ssh.webp)

Listo, tenemos acceso a través de ssh y ya podemos leer la flag user.txt, o eso creía...

```ssh
chuck-norris@karate:~$ cat user.txt
                 (__) 
                 (oo) 
           /------\/ 
          / |    ||   
         *  /\---/\ 
            ~~   ~~   
..."Have you mooed today?"...
```
El señor Shelldredd siempre nos tiene algún trolleo guardado en la manga... 

Pero no pasa nada, podemos probar con la ruta de cat o usar strings.

```ssh
chuck-norris@karate:~$ strings user.txt 
Flag User:
******U46AcfI*****
```

# Escalada de Privilegios

Ahora toca escalar privilegios, y como siempre comenzamos enumerando vectores de escalada.

Lanzo linpeas.sh pero no veo nada raro... asique paso a lanzar pspy para buscar procesos ocultos en ejecución

Y encuentro lo siguiente

>2022/09/22 12:51:29 CMD: UID=0    PID=10752   (kanga.sh)

Procedo a buscar el archivo...

```bash
chuck-norris@karate:~$ find / -name kanga.sh -type f 2>/dev/null
______________________________
⠄⠄⠄⠄⣠⣴⣿⣿⣿⣷⣦⡠⣴⣶⣶⣶⣦⡀⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄
⠄⠄⠄⣴⣿⣿⣫⣭⣭⣭⣭⣥⢹⣟⣛⣛⣛⣃⣀⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄⠄
⠄⣠⢸⣿⣿⣿⣿⢯⡓⢻⠿⠿⠷⡜⣯⠭⢽⠿⠯⠽⣀⠄⠄⠄⠄⠄⠄⠄⠄⠄
⣼⣿⣾⣿⣿⣿⣥⣝⠂⠐⠈⢸⠿⢆⠱⠯⠄⠈⠸⣛⡒⠄⠄⠄⠄⠄⠄⠄⠄⠄
⣿⣿⣿⣿⣿⣿⣿⣶⣶⣭⡭⢟⣲⣶⡿⠿⠿⠿⠿⠋⠄⠄⣴⠶⠶⠶⠶⠶⢶⡀
⣿⣿⣿⣿⣿⢟⣛⠿⢿⣷⣾⣿⣿⣿⣿⣿⣿⣿⣷⡄⠄⢰⠇⠄⠄⠄⠄⠄⠈⣧
⣿⣿⣿⣿⣷⡹⣭⣛⠳⠶⠬⠭⢭⣝⣛⣛⣛⣫⣭⡥⠄⠸⡄⣶⣶⣾⣿⣿⢇⡟
⠿⣿⣿⣿⣿⣿⣦⣭⣛⣛⡛⠳⠶⠶⠶⣶⣶⣶⠶⠄⠄⠄⠙⠮⣽⣛⣫⡵⠊⠁
⣍⡲⠮⣍⣙⣛⣛⡻⠿⠿⠿⠿⠿⠿⠿⠖⠂⠄⠄⠄⠄⠄⠄⠄⠄⣸⠄⠄⠄⠄
⣿⣿⣿⣶⣦⣬⣭⣭⣭⣝⣭⣭⣭⣴⣷⣦⡀⠄⠄⠄⠄⠄⠄⠠⠤⠿⠦⠤⠄⠄
_________FIND THIS..._________
```
Pero claro, olvidaba que es shelldredd y el trolleo nunca acaba :(

Sigo busando... ya que el pspy no me daba más info pero no encontré nada y volví a lanzarlo y descubrí esto

>2022/09/22 12:58:49 CMD: UID=0    PID=10902  | /bin/bash /lost+found/sakugawa-kanga.sh

Ahí está lo que buscaba

Lo que hay es un simple script en bash, pruebo a meter una shell en bash.



Abrimos un oyente de netcat y tras esperar unos segundos...

![](/assets/images/HMV/Rei-HackMyVM/root2.webp)

Ahora ya podemos leer la bandera root.txt, o eso creía, tonto de mí.

![](/assets/images/HMV/Rei-HackMyVM/root3.webp)

Nos dice lo siguiente 

>Maritrini plays with you, call her by name from the hidden area and maybe she will give you back the password.

Debemos buscar un archivo con el nombre maritrini y tendremos la bandera root.txt

Tras buscar un buen rato lo encuentro en la ruta:

>/mnt/.maritrini


_Agradecimientos a Shelldredd por esta máquina y por el trolleo gratuito_

