const discord = require("discord.js");
var request = require('request');
var fs =require('fs');

const bot = new discord.Client();

const config = require("./config.json");

var random = function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
};

var konachan = function (message) {
	var messageSplit = message.content.split(' ');
    var msgSearch = "";
    var searchOrig = "";
    for (var i = 1; i < messageSplit.length; i++) {
        if (i === 1) {
            searchOrig = messageSplit[i];
        } else {
            searchOrig = searchOrig + "+" + messageSplit[i];
        }
    }
    msgSearch = 'order:score rating:questionableplus ' + searchOrig;
    request.get('https://konachan.com/post.json', {
        qs: {
            limit: 200,
            tags: msgSearch
        }
    }, function (error, response, body) {
        if (error) {
            message.reply('a error occured!');
        }
        if (!error && response.statusCode == 200) {
            try {
                body = JSON.parse(body);
                console.log(body);
            } catch (e) {
                console.log(e);
            }
            if (typeof (body) !== 'undefined' && body.length > 0) {
                var randome = random(0, body.length);
                randome = Math.floor(randome);
                if (typeof(body[randome]) !== 'undefined' && typeof (body[randome].file_url) !== 'undefined') {
                    message.channel.sendMessage(`http://${body[randome].file_url.substring(2)}`, function (err, message) {
                        if (err) return console.log(e);
                    });
                } else {

                }
            } else {
                message.reply(t('nsfw-images.nothing-found', {
                    lngs: message.lang,
                    tags: searchOrig
                }));
            }
        }
    });
};

function testDroits(drois,message){
    var modRole = message.guild.roles.find("name", drois);

    if (!message.member.roles.has(modRole.id)){
        console.log(message.mentions.users.size);
		message.reply("le drois "+ drois+" est nécessaire");
		return false;
    }
    else {
    	return true;
	}

} // test si la persone ayant lancer la comande à les droits nécessaires

function userPresent(message){
    if (message.mentions.users.size === 0) {
        message.reply("merci de citer un utilisateur");

        return false;
    }
    else {
    	return true;
	}
} // test si un utilisateur est citer dans la comande



bot.on("ready", function(){
	console.log("Bot on");
	console.log	("Bonjours je suis "+ config.namebot);
});

// permet de saluer une personne quand elle est ajouter au server
bot.on("guildMemberAdd", function(member){
		var guild = member.guild;
		// la notation avec les ` permet d'executer des portion de code qui sont dans ${} et de faire la concaténation en même temps
		guild.defaultChannel.sendMessage(`welcome ${member.user}`);
});

// dit bonjour/ aurevoir si la variable "hello" dans config.json est "true"
bot.on("presenceUpdate", (newMember, message) =>{
	var guild = newMember.guild;

	if (newMember.user.presence.status === "online" && config.hello === "true"){
		guild.defaultChannel.sendMessage(`hi ${newMember.user}, taper "==help" pour les commandes`);
	}

	if (newMember.user.presence.status === "offline" && config.hello === "true"){
		guild.defaultChannel.sendMessage(`bye ${newMember.user}`);
	}
});

bot.on("presenceUpdate", (oldMember, newMember) =>{
	console.log("overwatch test");
	var guild = newMember.guild;

	// recherche si il existe un role "overwatch" qui existe parmis ceux existant
	var playRole = guild.roles.find("name","Overwatch");

	// si le role n'est pas trouver alors on sort de l'execution 
	if (!playRole)return;

	// Attribue le role  Overwatch a toute personne qui lance le jeu et le lui retire une foit qu'il quite le jeux
	// check en premier si un jeu est jouer, si on recherche le jeu alors qu'aucun est jouer alors sa crash
	if (newMember.user.presence.game && newMember.user.presence.game.name === "Overwatch"){
		newMember.addRole(playRole);
	}else if (!newMember.user.presence.game && newMember.roles.has(playRole.id)){
			newMember.removeRole(playRole);
	}
});

bot.on("message", function(message){



	console.log("-----------------------------------------");

	if (message.content === "@"+config.namebot){
		message.reply('pong');
	}


	// evite que le bot réponde a lui même
	if (message.author.bot)return;

	// refuse tout les messages qui ne commencernt pas par le préfix 
	 if (!message.content.startsWith(config.prefix)) {
	 	return;
		}

	// split le message recue après le == pour recup la commande qui le suit
	var command = message.content.split(" ")[0];
	command = command.slice(config.prefix.length);
	console.log("commande "+command);

	// récupére ce qui vient après la commande entrer (si ont veut entrer des apramètres )
	var args = message.content.split(" ").slice(1);
	console.log("args "+args);

	if (command === "pic"){
		konachan(message);
	}

	if (command === 'add') {
			var numbers = args.map(n=> parseInt(n));
			var total = numbers.reduce ( (p, c) => p+c);
			message.channel.sendMessage(total);
		}

		// dir ce que on lui dit de dire mais seulemnt si la personne a le role chat
	if (command === "say")
			{
					// récupére le role chat dans les roles présent
				var modRole = message.guild.roles.find("name", "chat");
				if (message.member.roles.has(modRole.id))
				{
					message.channel.sendMessage(args);			
				} 
				else 
				{
					message.reply("permision chat nécessaire");
				}
			}

	//ici c'est pour kick quelqu'un
	if (command === "kick"){

		if(testDroits("mod",message) && userPresent(message) ) {



				// check si le bot a la permision mod pour kicker
				if (!message.guild.member(bot.user).roles.find("name", "mod")) {
					return message.reply("le bot n'a pas la permision mod");
				}

				// retourne le premier user nommer dans la commande
				var user = message.mentions.users.first();

				return;
				// regarde si le user les bien présent dans le server
				if (!user) {
					return message.reply("L'user n'est pas valide");
				}

				//kick enfin le premier user qui a été citer dans la commande kick,
				// envoie mesage de confirmation ou bien renvoie l'erreur. Le catch(console.error) ne marche qu'avec les commandes discord.js
				// message.guild.member(message.mentions.users.first()).kick().then(member => { -> version antérieur au cas ou ça foire
					message.guild.member(user).kick().then(member => {
						console.log(member);
					message.channel.send('Kicked!' + member.user.username);
				}).catch(console.error);
        }
	}

	if (command === "presentation"){
			message.channel.sendMessage("Le bot est en test total, j'essaie de découvrir ce que ont peut faire avec la librairie \"discord.js\"");
	}

	if (command === "help"){
		message.channel.sendMessage('==say <phrase>\n ==kick <people>\n ==add <number1> <number2> <number n>\n ==presentation\n ==pic <tag>\n');
		}

	if (command === "ban"){
		message.channel.sendMessage("http://www.themarysue.com/wp-content/uploads/2014/09/banhammer.jpg");
		// renvoie le message sans citer de personne. 
	}

	if (message.content.startsWith(config.prefix + 'blabla')){
		message.channel.sendMessage('bloblo');
		}

	if (command === "hello"){

			if(config.hello === "true" && args == "false"){
				console.log("true -> false");
				config.hello = "false";
                fs.writeFile("./config.json", JSON.stringify(config), function (err) {
                    if (err) return console.log(err);
                    console.log(JSON.stringify(config));
                    console.log('writing to ./config.json');
                });
			}
			else if (config.hello === "false" && args == "true") {
				console.log("false -> true");
				config.hello = "true";
                fs.writeFile("./config.json", JSON.stringify(config), function (err) {
                    if (err) return console.log(err);
                    console.log(JSON.stringify(config));
                    console.log('writing to ./config.json');
                });
			}
	} // Changement de la valeur "hello" dans le fichier json

	// eval aparement c'est très puissant et si c'est pas sécuriser ça permet de metre le zbeu sur le serveur qui host le bot
	if (command === "eval"){
			return;

	}
});


bot.login(config.token);

