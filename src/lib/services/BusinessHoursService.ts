/**
 * Business hours — stub; later swap for Places opening hours / dedicated API.
 */
export interface HoursInfo {
  isOpen: boolean;
  label: string;
  closesAt?: string;
}

export interface BusinessHoursProvider {
  getHours(placeName: string, category: string): Promise<HoursInfo>;
}

export class StubBusinessHoursProvider implements BusinessHoursProvider {
  async getHours(placeName: string, _category: string): Promise<HoursInfo> {
    const hour = new Date().getHours();
    const isOpen = hour >= 8 && hour < 21;
    return {
      isOpen,
      label: isOpen ? "Open now · closes 9:00 PM" : "Currently closed",
      closesAt: isOpen ? "9:00 PM" : undefined,
    };
  }
}

export class BusinessHoursService {
  constructor(private readonly provider: BusinessHoursProvider) {}

  getHours(placeName: string, category: string) {
    return this.provider.getHours(placeName, category);
  }
}

export const businessHoursService = new BusinessHoursService(
  new StubBusinessHoursProvider()
);
