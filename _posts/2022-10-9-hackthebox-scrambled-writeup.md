---
layout      : post
title       : "Scrambled - HackTheBox"
author      : elc4br4
image       : assets/images/HTB/Scrambled-HackTheBox/Scrambled.webp
category    : [ htb ]
tags        : [ Windows ]
---



# Renocimiento de Puertos

## Enum-nmap
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

> Dominio scrm.local y dc --> dc1.scrm.local que nos dice que estamos ante un DC.

Lo añadimos al etc/hosts.

# Enumeracion SMB 

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

# KERBEROS

Con la herramienta kerbrute puedo tratar de buscar usuarios válidos usando una lista de palabras.

Usaré las listas de usuarios de este repositorio, ya que está enfocado para la enumeración de usuarios a través de Kerberos.

[https://github.com/attackdebris/kerberos_enum_userlists](https://github.com/attackdebris/kerberos_enum_userlists)

A través de kerbrute enumeramos usuarios.

![](/assets/images/HTB/Scrambled-HackTheBox/kerbrute.webp)

❯ ./kerbrute userenum -d scrm.local --dc 10.10.11.168 /opt/kerberos_enum_userlists/A-ZSurnames.txt

EXPLICAR COMANDO

Obtenemos varios usuarios, por lo tanto teniendo usuarios podríamos desplegar el ataque ASREPRoast para intentar conseguir el hash NTLM de alguno de los usuarios, asique me copio los usuarios en un archivo de texto antes de proceder al ataque ASREPRoast

![](/assets/images/HTB/Scrambled-HackTheBox/users.webp)

Y lanzamos el ataque ASREPRoast con la utilidad GETNPUsers.py de la suite Impacket.

![](/assets/images/HTB/Scrambled-HackTheBox/ASREPRoast.webp)
❯ python3 GetNPUsers.py -usersfile /home/elc4br4/HTB/Scramble/users -dc-ip 10.10.11.168 scrm.local/
EPLICAR COMANDO


Pero no ha habido suerte, no nos arroja ningún hash, y esto es debido a lo que vimos anteriormente de que el NTLM estaba restringido.

Pero a través de kerbrute también podemos hacer fuerza bruta a las contraseñas de cada uno de los usuarios que hemos encontrado

