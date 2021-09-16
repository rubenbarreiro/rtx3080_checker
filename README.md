# RTX Checker

Primary purpose for this project was to create a bot for purchasing a rtx 3080 card for me. As scalpers were doing the same, but I just wanted a card for me and paying a shitton of money for usage on the good bots just for one usage was a no-go for me.   

They are cool open source bots out there, but as I wanted to know how to make one so I decided to do so.   

As stated above, my primary goal was to create a bot, and that I did, but as neweeg likely implemented measures against bots and maybe they even changed the page layout a bit, that broke the bot from time to time, so I couldn't get my card 🤷‍♂️    

Moving forward(aug/04/2021) I won't code anything else for the bot, as it proved to be rather dificult and time consuming to fix anything else that newegg decides to change... instead I'll be using part of the code base to develop an alexa skill(that would execute a lambda function) which will help me out checking(using chrome same as the bot) the neweeg product shuffle. That way I could tell alexa to look for a 3080 or 3080 ti wihout bundles(hate those motherfucker bundles), and without me having to check that by myself. I got an echo dot recently so that picked my interest to develop an alexa skill mixed with this lambda base code.    


# AWS Config
First things first, we need an AWS account, even with free tier would be good.

1. Create a lambda function. make it custom because we will upload our huge zip manually
2. There is a required layer to include in the function, as there is tooo much things to get headless chrome working in a lambda function, someone else made a layer for that. Here is the information:

    Version ARN: arn:aws:lambda:us-east-1:764866452798:layer:chrome-aws-lambda:22   
    Layer version: 22    
    Name: chrome-aws-lambda   
3. Try to set RAM for that function as high as 1500 mb, so the function will get more cpu and won't take too much time to execute.
4. The credentials for the server to run need to be stored in a `.env.server` file. One could easily do that injecting the envvars in the lambda function config, but I'm lazy so use that.


