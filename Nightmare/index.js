const discord = require("discord.js");
var request = require('request');

const bot = new discord.Client();

const config = require("./config.json");

var random = function getRandomArbitrary(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
};

var konachan = function (message) {
	let messageSplit = message.content.split(' ');
    let msgSearch = "";
    let searchOrig = "";
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

bot.on("ready", function(){
	console.log("Bot on");
	console.log	("Bonjours je suis "+ config.namebot);
});

// permet de saluer une personne quand elle est ajouter au server
bot.on("guildMemberAdd", function(member){
		let guild = member.guild;
		// la notation avec les ` permet d'executer des portion de code qui sont dans ${} et de faire la concaténation en même temps
		guild.defaultChannel.sendMessage(`welcome ${member.user}`);
});

// dit bonjours et aurevoir
bot.on("presenceUpdate", (newMember, message) =>{
	let guild = newMember.guild;

	if (newMember.user.presence.status === "online"){
		guild.defaultChannel.sendMessage(`hi ${newMember.user}, taper "==help" pour les commandes`);
	}

	if (newMember.user.presence.status === "offline"){
		guild.defaultChannel.sendMessage(`bye ${newMember.user}`);
	}
});

bot.on("presenceUpdate", (oldMember, newMember) =>{
	let guild = newMember.guild;

	// recherche si il existe un role "overwatch" qui existe parmis ceux existant
	let playRole = guild.roles.find("name","Overwatch");

	// si le role n'est pas trouver alors on sort de l'execution
	if (!playRole)return;

	// Attribue le role  Overwatch a toute personne qui lance le jeu et le lui retire une foit qu'il quite le jeux
	// check en premier si un jeu est jouer, si on recherche le jeu alors qu'aucun est jouer alors sa crash
	if (newMember.user.presence.game && newMember.user.presence.game.name === "Overwatch"){
		newMember.addRole(playRole);
	}else if (!newMember.usr.presence.game && newMember.role.has(playRole.id)){
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
	let command = message.content.split(" ")[0];
	command = command.slice(config.prefix.length);
	console.log("commande "+command);

	// récupére ce qui vient après la commande entrer (si ont veut entrer des apramètres )
	let args = message.content.split(" ").slice(1);
	console.log("args "+args);

	if (command === "pic"){
		konachan(message);
	}
	if (command === 'add')
		{
			let numbers = args.map(n=> parseInt(n));
			let total = numbers.reduce ( (p, c) => p+c);
			message.channel.sendMessage(total);
		}

		// dir ce que on lui dit de dire mais seulemnt si la personne a le role chat
	if (command === "say")
			{
					// récupére le role chat dans les roles présent
				let modRole = message.guild.roles.find("name", "chat");
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

		// vérification que la personne voulant kick aie les droit nécessaire
		let modRole = message.guild.roles.find("name", "mod");

		if (!message.member.roles.has(modRole.id)){
			 console.log(message.mentions.users.size);
			return	message.reply("la permision mod est nécessaire");
		}

		// check si un user est citer dans la commande
		if (message.mentions.users.size === 0) {
			 message.reply("il faut quelqu'un a kick");

			 return;
		}

		// retourne le premier user nommer dans la commande
		let kickMember = message.guild.member(message.mentions.users.first());
		// regarde si le user les bien présent dans le server
		if (!kickMember){
			return message.reply("L'user n'est pas valide");
		}

			// check si le bot a la permision mod pour kicker
		if(!message.guild.member(bot.user).hasPermission("mod")){
			return message.reply("le bot n'a pas la permision mod");
		}
				// kick enfin le premier user qui a été citer dans la commande kick,
				// envoie mesage de confirmation ou bien renvoie l'erreur. Le catch(console.error) ne marche qu'avec les commandes discord.js
		kickMember.kick().then(member => {
			message.reply(`${member.user.username} a bien été kick `).catch(console.error);
		}).catch(console.error)
	}

	if (command === "presentation"){
			message.channel.sendMessage("Le bot est en test total, j'essaie de découvrir ce que ont peut faire avec la librairie \"discord.js\"");
	}

	if (command === "help"){
		message.channel.sendMessage('!=say <phrase>\n !=kick <people>\n !=add <number1> <number2> <number n>\n !=presentation\n !=pic <tag>\n');
		}

	if (command === "ban"){
		message.channel.sendMessage("http://www.themarysue.com/wp-content/uploads/2014/09/banhammer.jpg");
		// renvoie le message sans citer de personne.
	}
	if (message.content.startsWith(config.prefix + 'blabla')){
		message.channel.sendMessage('bloblo');
		}


	// eval aparement c'est très puissant et si c'est pas sécuriser ça permet de metre le zbeu sur le serveur qui host le bot
	if (command === "eval"){
			return;

	}
});


bot.login(config.token);
