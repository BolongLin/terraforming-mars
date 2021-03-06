import { Tags } from "../Tags";
import { Player } from "../../Player";
import { CorporationCard } from '../corporation/CorporationCard';
import { CardName } from '../../CardName';
import { ResourceType } from "../../ResourceType";
import { SelectOption } from "../../inputs/SelectOption";
import { OrOptions } from "../../inputs/OrOptions";
import { Game } from "../../Game";
import { IProjectCard } from "../IProjectCard";
import { CorporationName } from "../../CorporationName";
import { LogMessageType } from "../../LogMessageType";
import { LogMessageData } from "../../LogMessageData";
import { LogMessageDataType } from "../../LogMessageDataType";

export class PharmacyUnion implements CorporationCard {
    public name: CardName = CardName.PHARMACY_UNION;
    public tags: Array<Tags> = [Tags.MICROBES, Tags.MICROBES];
    public startingMegaCredits: number = 46; // 54 minus 8 for the 2 deseases
    public resourceType: ResourceType = ResourceType.DISEASE;
    public resourceCount: number = 0;
    public isDisabled: boolean = false;

    public play() {
        this.resourceCount = 2;
        return undefined;
    }

    public initialAction(player: Player, game: Game) {
        player.cardsInHand.push(game.drawCardsByTag(Tags.SCIENCE, 1)[0]);
        const drawnCard = game.getCardsInHandByTag(player, Tags.SCIENCE).slice(-1)[0];

        game.log(
            LogMessageType.DEFAULT,
            "${0} drew ${1}",
            new LogMessageData(LogMessageDataType.PLAYER, player.id),
            new LogMessageData(LogMessageDataType.CARD, drawnCard.name)
        );
        
        return undefined;
    }

    public onCardPlayed(player: Player, game: Game, card: IProjectCard): void {
        if (this.isDisabled) return undefined;
        
        if (card.tags.includes(Tags.MICROBES)) {
            const microbeTagCount = card.tags.filter((cardTag) => cardTag === Tags.MICROBES).length;
            player.addResourceTo(this, microbeTagCount);
            player.megaCredits = Math.max(player.megaCredits - microbeTagCount * 4, 0)
        }
            
        if (player.isCorporation(CorporationName.PHARMACY_UNION) && card.tags.includes(Tags.SCIENCE)) {
            this.runInterrupts(player, game, card.tags.filter((tag) => tag === Tags.SCIENCE).length);
            return undefined;
        }
    }

    private runInterrupts(player: Player, game: Game, scienceTags: number): void {
        if (scienceTags <= 0) return;

        if (this.resourceCount > 0) {
            this.resourceCount--;
            player.increaseTerraformRating(game);
            game.log(
                LogMessageType.DEFAULT,
                "${0} removed a disease from ${1} to gain 1 TR",
                new LogMessageData(LogMessageDataType.PLAYER, player.id),
                new LogMessageData(LogMessageDataType.CARD, this.name)
            );
            this.runInterrupts(player, game, scienceTags - 1);
            return undefined;
        } else {
            const availableOptions: OrOptions = new OrOptions();

            availableOptions.options.push(
                new SelectOption('Turn this card face down and gain 3 TR', () => {
                    this.isDisabled = true;
                    player.increaseTerraformRatingSteps(3, game);
                    game.log(
                        LogMessageType.DEFAULT,
                        "${0} turned ${1} face down to gain 3 TR",
                        new LogMessageData(LogMessageDataType.PLAYER, player.id),
                        new LogMessageData(LogMessageDataType.CARD, this.name)
                    );
                    return undefined;
                })
            );
            availableOptions.options.push(
                new SelectOption('Do nothing', () => {
                    this.runInterrupts(player, game, scienceTags - 1);
                    return undefined;
                })
            );

            game.addInterrupt({ player, playerInput: availableOptions});
        }
      }
}
