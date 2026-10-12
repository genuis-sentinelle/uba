import { DomainEvent } from '../types';

type EventHandler<T extends DomainEvent['type']> = (
  event: Extract<DomainEvent, { type: T }>
) => void;

class EventBus {
  private handlers = new Map<string, Array<(e: any) => void>>();

  /**
   * S'abonner à un événement du domaine
   */
  on<T extends DomainEvent['type']>(type: T, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type)!.push(handler);

    // Retourne la fonction de désabonnement
    return () => {
      const list = this.handlers.get(type) || [];
      this.handlers.set(
        type,
        list.filter(fn => fn !== handler)
      );
    };
  }

  /**
   * Publier un événement à travers toute l'application
   */
  emit(event: DomainEvent): void {
    const list = this.handlers.get(event.type) || [];
    list.forEach(fn => {
      try {
        fn(event);
      } catch (err) {
        console.error(`[EventBus] Erreur dans le handler pour ${event.type}:`, err);
      }
    });
  }

  /**
   * Réinitialise tous les abonnements (utile pour les tests ou reset)
   */
  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
