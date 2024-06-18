
# How to build the profile if you directly want to use the ECR with the powershell and docker and that Aws Ecs is give error of the login in Windows

## Step 1: Install ECR Tools

``` 
Install-Module -Name AWS.Tools.Common 
Install-Module -Name AWS.Tools.ECR
```

## step 2: After that it is required to set the credentials, and tell the Credential-Manager that those are to be used as default. (use powershell)

``` 
Set-AWSCredential `
             -AccessKey <KeyName> `
             -SecretKey <Key> `
             -StoreAs <Profile>

```


## step 3: After that create repository in ECR and create repository in ECR and get the URI of the repository and copy paste the command in the powershell

## step 4: If that command is give the error then use the following command to login to the ECR

``` (Get-ECRLoginCommand -ProfileName <Profile-Name> -Region <Region-Name>).Password | docker login --username AWS --password-stdin <your-account-id>.dkr.ecr.eu-north-1.amazonaws.com4 ```


# If you want to change the profile credential use this command 
``` aws configure --profile <Profile-Name> ```


(Get-ECRLoginCommand -ProfileName abhishekAws -Region eu-north-1).Password | docker login --username AWS --password-stdin 292304982490.dkr.ecr.eu-north-1.amazonaws.com