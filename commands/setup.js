//9cmd
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder } = require("discord.js");
const { owner, staff } = require("../config.json");
const db = require("croxydb");

module.exports = {
    name: "setup",
    description: "ticket sistemini kurar",
    type: 1,
    options: [
        {
            name: "kanal",
            description: "kanal seçin",
            type: 7,
            required: true,
        },
    ],
    run: async (client, interaction) => {
        if (interaction.user.id !== owner) {
            return interaction.reply({ content: "Dur Senin İşin Değil Bu", ephemeral: true });
        }

        const lokikanal = interaction.options.getChannel("kanal");
        const guildId = interaction.guildId;
        const oldChannelId = db.get(`ticket_${guildId}`);

        if (oldChannelId && oldChannelId === lokikanal.id) {
            return interaction.reply("Ticket kanalı zaten bu kanal olarak ayarlı.");
        }

        db.set(`ticket_${guildId}`, lokikanal.id);

        const loki = new EmbedBuilder()
            .setDescription(`Başarılı Şekilde Ticket Kanalı ${lokikanal} Olarak Ayarladım`)
            .setColor("Green")
            .setFooter({ text: "9cmd" });

        await interaction.reply({ embeds: [loki] });

        const cmdticket = new EmbedBuilder()
            .setTitle("Ticket Sistemi")
            .setDescription("Bir ticket oluşturmak için aşağıdaki butona tıklayın.")
            .setColor(0x00AE86);

        const ticketButtoncmd = new ButtonBuilder()
            .setCustomId("cmd")
            .setLabel("Ticket Oluştur")
            .setStyle(1);

        const row = new ActionRowBuilder().addComponents(ticketButtoncmd);

        await lokikanal.send({ embeds: [cmdticket], components: [row] });
    }
};

client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "cmd") {
        const guild = interaction.guild;
        const member = interaction.member;

        const existingChannelId = db.get(`ticket_channel_${guild.id}_${member.id}`);
        if (existingChannelId) {
            const existingChannel = guild.channels.cache.get(existingChannelId);
            if (existingChannel) {
                return interaction.reply({ content: "Zaten açık bir ticket kanalınız var. Zorlama İşte", ephemeral: true });
            } else {
                db.delete(`ticket_channel_${guild.id}_${member.id}`); 
            }
        }

        const ticketcmdkanal = await guild.channels.create({
            name: `ticket-${member.user.username}`,
            type: 0, 
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: ['ViewChannel'], 
                },
                {
                    id: member.id,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'], 
                },
                {
                    id: staff,
                    allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory'], 
                }
            ],
        });

        db.set(`ticket_channel_${guild.id}_${member.id}`, ticketcmdkanal.id);

        const girismesasjcmd = new EmbedBuilder()
            .setTitle("Başarılı Şekilde Ticket Oluşturuldu")
            .setDescription(`Hoşgeldin ${member}, Lütfen Bekle Yetkililer En Kısa Sürede İlgilenecektir || 9cmd ||`)
            .setColor("DarkGreen");

        await ticketcmdkanal.send({ embeds: [girismesasjcmd] });

        await interaction.reply({ content: `Ticket kanalı oluşturuldu: ${ticketcmdkanal}`, ephemeral: true });
    }
});
