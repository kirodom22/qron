// @ts-ignore
import TronWeb from 'tronweb';

class TronService {
  private tronWeb: any = null;
  private walletAddress: string | null = null;

  async connect(): Promise<string> {
    // Check if TronLink is installed
    if (typeof window !== 'undefined' && (window as any).tronLink) {
      try {
        // Request account access
        const res = await (window as any).tronLink.request({
          method: 'tron_requestAccounts'
        });

        if (res.code === 200) {
          this.tronWeb = (window as any).tronLink.tronWeb;
          this.walletAddress = this.tronWeb.defaultAddress.base58;

          console.log('[TRON] Connected:', this.walletAddress);
          return this.walletAddress || '';
        } else {
          throw new Error('User rejected connection');
        }
      } catch (error) {
        console.error('[TRON] Connection error:', error);
        throw error;
      }
    } else {
      throw new Error('TronLink not installed');
    }
  }

  async deposit(amount: number, contractAddress: string): Promise<string> {
    if (!this.tronWeb || !this.walletAddress) {
      throw new Error('Wallet not connected');
    }

    try {
      // Convert TRX to SUN (1 TRX = 1,000,000 SUN)
      const amountInSun = this.tronWeb.toSun(amount);

      // Get contract instance
      const contract = await this.tronWeb.contract().at(contractAddress);

      // Call joinGame function
      const tx = await contract.joinGame().send({
        callValue: amountInSun,
        shouldPollResponse: true
      });

      console.log('[TRON] Transaction:', tx);
      return tx;
    } catch (error) {
      console.error('[TRON] Deposit error:', error);
      throw error;
    }
  }

  getWalletAddress(): string | null {
    return this.walletAddress;
  }

  isConnected(): boolean {
    return this.tronWeb !== null && this.walletAddress !== null;
  }

  disconnect(): void {
    this.tronWeb = null;
    this.walletAddress = null;
  }

  // Mock deposit for development (placeholder)
  async mockDeposit(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('MOCK_TX_' + Date.now());
      }, 1000);
    });
  }
}

export const tronService = new TronService();
