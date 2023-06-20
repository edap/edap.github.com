---
layout: post
title: "Unreal Engine on Linux"
category: 
tags: []
---

Here you can find information about how to setup a working enviroment to develop Unreal Engines projects on Linux, specifically Ubuntu and others Linux distros based on Ubuntu. Those instructions has been tested on PopOS 22.04 and Ubuntu 22.04.

### Installation

- Download and unpack the latest [compiled version of Unreal](https://www.unrealengine.com/en-US/linux) Engine.
- From the same page, download Bridge, it is the plugin used to manage Quixel (once called Megascan) assets. Unpack it and put it in the subfolder `Engine/Plugins` of your Unrear Engine installation. Remember to enable it in Unreal Engine, under "edit -> plugins"
- You can now launch the UE editor with `/bin/bash /pathToYourUnrealEngineFolder/Binaries/Linux/UnrealEditor` and check that it is working.
- Working with UE often requires to download assets from the Unreal Marketplace. On linux, you can install a software that simplify this process, plus it can be used to manage projects and different Unreal Engine versions. The software is called [Epic Assets Manager](https://flathub.org/en/apps/io.github.achetagames.epic_asset_manager), and it is distribuited thorugh flathub. I personally add a launcher to the desktop because from there I have an overview of my projects and I can can open them directly. To do so, open the Epic Assets Manager then right click on the icon in the desktop bar and "Add to Favorites".
- If you prefer to setup a launcher icon for the UE editor on your desktop, you can use alacarte `apt-get install alacarte`, or you can create the entry manually.

### Code Editor

If you are just developing Unreal Engine using blueprints, you are ready to get started. But if your plan is to use blueprints along with c++, you do need to tell Unreal Engine wich code editor are you using. I will report here two options, Visual Studio Code and Rider.

- For Visual Studio Code, install it and then be sure to have clang installed (`apt-get install clang`), install the *CodeLLDB* extension then in the UE editor, go to "Edit -> Editor Preferences -> General -> Source Code" and select "Visual Studio Code".
- For [Rider](https://www.jetbrains.com/rider/) (and for a much more integrated developer experience), install Rider. After opening rider, select an Unreal Project previously created. Rider recognize that it is an Unreal project and ask you to install the plugin "Rider Live" either in UE or in Rider, I choose the option to install it in Unreal Engine and I've never had a problem. Then go into the UE editor "Edit -> Editor preferences -> General -> Source Code", there is no option for rider, select "Visual Studio Code", it will work the same way. To add the launcher icon to your desktop, go to "Tools -> Create Desktop Entry".
- To compile the code, compile it from the Unreal Engine editor, clicking on the small icon on the bottom right corner of your screen that looks like a tetris.
![compile UE](/assets/media/posts/compile-ue.png)
This action actually does not recompile the entire project, it performs what is called *hot reloading*. It is faster then recompiling everything, but once in a while remember to recompile the whole project, as it may happens that some edit in the c++ classes are not visible in the blueprints. To do so, in Rider, click on the "build" action on the top bar, and select the name of your project.

### Troubleshotting

Sometime you may receive the error "try rebuild from source manually". In this case close the UE editor and delete the folders Saved,Intermediate,Binaries and DerivedDataCache. Re-open the editor, it will ask you to recompile it, say yes. When it is finished reopen Rider.