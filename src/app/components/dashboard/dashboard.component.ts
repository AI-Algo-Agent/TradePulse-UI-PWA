import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { TradeService } from '../../services/trade.service';
import { ZerodhaService } from '../../services/zerodha.service';
import { Trade, Holding } from '../../models/trade.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatCardModule,
    MatToolbarModule,
    MatIconModule,
    MatSnackBarModule
  ],
  template: `
    <mat-toolbar color="primary" class="dashboard-header">
      <span>TradePulse Dashboard</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>

    <div class="dashboard-container">
      <!-- Action Buttons -->
      <div class="action-buttons">
        <button mat-raised-button color="accent" (click)="showAccountDetails()">
          Show Zerodha Account Details
        </button>
        <button mat-raised-button color="accent" (click)="showMargins()">
          Show Zerodha Margins
        </button>
      </div>

      <!-- Account Details and Margins Display -->
      <div class="info-section" *ngIf="accountDetails || margins">
        <mat-card *ngIf="accountDetails" class="info-card">
          <mat-card-header>
            <mat-card-title>Account Details</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <pre>{{ accountDetails }}</pre>
          </mat-card-content>
        </mat-card>

        <mat-card *ngIf="margins" class="info-card">
          <mat-card-header>
            <mat-card-title>Margins</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <pre>{{ margins }}</pre>
          </mat-card-content>
        </mat-card>
      </div>

      <!-- Finalised Trades Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Finalised Trades</mat-card-title>
          <div class="spacer"></div>
          <button mat-icon-button (click)="refreshTrades()" matTooltip="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div class="table-container">
            <table mat-table [dataSource]="trades" class="trades-table">
              <ng-container matColumnDef="symbol">
                <th mat-header-cell *matHeaderCellDef>Symbol</th>
                <td mat-cell *matCellDef="let trade">{{ trade.symbol }}</td>
              </ng-container>

              <ng-container matColumnDef="description">
                <th mat-header-cell *matHeaderCellDef>Description</th>
                <td mat-cell *matCellDef="let trade">{{ trade.description }}</td>
              </ng-container>

              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef>Date</th>
                <td mat-cell *matCellDef="let trade">{{ trade.date }}</td>
              </ng-container>

              <ng-container matColumnDef="sentiment">
                <th mat-header-cell *matHeaderCellDef>Sentiment</th>
                <td mat-cell *matCellDef="let trade">
                  <span [class]="'sentiment-' + trade.sentiment.toLowerCase()">
                    {{ trade.sentiment }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="confidence">
                <th mat-header-cell *matHeaderCellDef>Confidence</th>
                <td mat-cell *matCellDef="let trade">{{ trade.confidence }}%</td>
              </ng-container>

              <ng-container matColumnDef="predictedPercent">
                <th mat-header-cell *matHeaderCellDef>Predicted %</th>
                <td mat-cell *matCellDef="let trade">
                  <span [class]="trade.predictedPercent >= 0 ? 'positive' : 'negative'">
                    {{ trade.predictedPercent }}%
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="entryPrice">
                <th mat-header-cell *matHeaderCellDef>Entry Price</th>
                <td mat-cell *matCellDef="let trade">₹{{ trade.entryPrice | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="targetPrice">
                <th mat-header-cell *matHeaderCellDef>Target Price</th>
                <td mat-cell *matCellDef="let trade">₹{{ trade.targetPrice | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="stoploss">
                <th mat-header-cell *matHeaderCellDef>Stoploss</th>
                <td mat-cell *matCellDef="let trade">₹{{ trade.stoploss | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="takeTrade">
                <th mat-header-cell *matHeaderCellDef>Take Trade</th>
                <td mat-cell *matCellDef="let trade">
                  <span [class]="trade.takeTrade ? 'take-trade-yes' : 'take-trade-no'">
                    {{ trade.takeTrade ? 'YES' : 'NO' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="savedAt">
                <th mat-header-cell *matHeaderCellDef>Saved At</th>
                <td mat-cell *matCellDef="let trade">{{ trade.savedAt | date:'short' }}</td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let trade">
                  <button mat-raised-button color="warn" size="small" 
                          (click)="sellTrade(trade)">
                    Sell
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="tradesDisplayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: tradesDisplayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Zerodha Holdings Table -->
      <mat-card class="table-card">
        <mat-card-header>
          <mat-card-title>Zerodha Holdings</mat-card-title>
          <div class="spacer"></div>
          <button mat-icon-button (click)="loadHoldings()" matTooltip="Refresh Holdings">
            <mat-icon>refresh</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="holdingsError" class="error-message">
            {{ holdingsError }}
          </div>
          <div class="table-container" *ngIf="!holdingsError">
            <table mat-table [dataSource]="holdings" class="holdings-table">
              <ng-container matColumnDef="symbol">
                <th mat-header-cell *matHeaderCellDef>Symbol</th>
                <td mat-cell *matCellDef="let holding">{{ holding.symbol }}</td>
              </ng-container>

              <ng-container matColumnDef="quantity">
                <th mat-header-cell *matHeaderCellDef>Quantity</th>
                <td mat-cell *matCellDef="let holding">{{ holding.quantity }}</td>
              </ng-container>

              <ng-container matColumnDef="averagePrice">
                <th mat-header-cell *matHeaderCellDef>Average Price</th>
                <td mat-cell *matCellDef="let holding">₹{{ holding.averagePrice | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="lastPrice">
                <th mat-header-cell *matHeaderCellDef>Last Price</th>
                <td mat-cell *matCellDef="let holding">₹{{ holding.lastPrice | number:'1.2-2' }}</td>
              </ng-container>

              <ng-container matColumnDef="pnl">
                <th mat-header-cell *matHeaderCellDef>P&L</th>
                <td mat-cell *matCellDef="let holding">
                  <span [class]="holding.pnl >= 0 ? 'positive' : 'negative'">
                    ₹{{ holding.pnl | number:'1.2-2' }}
                  </span>
                </td>
              </ng-container>

              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let holding">
                  <button mat-raised-button color="warn" size="small" 
                          (click)="sellHolding(holding)">
                    Sell
                  </button>
                </td>
              </ng-container>

              <tr mat-header-row *matHeaderRowDef="holdingsDisplayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: holdingsDisplayedColumns;"></tr>
            </table>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .dashboard-header {
      position: sticky;
      top: 0;
      z-index: 100;
    }
    
    .spacer {
      flex: 1 1 auto;
    }
    
    .dashboard-container {
      padding: 20px;
      max-width: 1400px;
      margin: 0 auto;
    }
    
    .action-buttons {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .info-section {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    
    .info-card {
      flex: 1;
      min-width: 300px;
    }
    
    .info-card pre {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      overflow-x: auto;
      font-size: 12px;
      white-space: pre-wrap;
    }
    
    .table-card {
      margin-bottom: 24px;
    }
    
    .table-container {
      overflow-x: auto;
    }
    
    .trades-table, .holdings-table {
      width: 100%;
      min-width: 800px;
    }
    
    .sentiment-bullish {
      color: #4caf50;
      font-weight: 600;
    }
    
    .sentiment-bearish {
      color: #f44336;
      font-weight: 600;
    }
    
    .positive {
      color: #4caf50;
      font-weight: 600;
    }
    
    .negative {
      color: #f44336;
      font-weight: 600;
    }
    
    .take-trade-yes {
      color: #4caf50;
      font-weight: 600;
    }
    
    .take-trade-no {
      color: #f44336;
      font-weight: 600;
    }
    
    .error-message {
      color: #f44336;
      padding: 16px;
      text-align: center;
      background-color: #ffebee;
      border-radius: 4px;
      margin: 16px 0;
    }
    
    @media (max-width: 768px) {
      .dashboard-container {
        padding: 12px;
      }
      
      .action-buttons {
        flex-direction: column;
      }
      
      .action-buttons button {
        width: 100%;
      }
      
      .info-section {
        flex-direction: column;
      }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  trades: Trade[] = [];
  holdings: Holding[] = [];
  accountDetails = '';
  margins = '';
  holdingsError = '';
  
  tradesDisplayedColumns: string[] = [
    'symbol', 'description', 'date', 'sentiment', 'confidence', 
    'predictedPercent', 'entryPrice', 'targetPrice', 'stoploss', 
    'takeTrade', 'savedAt', 'actions'
  ];
  
  holdingsDisplayedColumns: string[] = [
    'symbol', 'quantity', 'averagePrice', 'lastPrice', 'pnl', 'actions'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private tradeService: TradeService,
    private zerodhaService: ZerodhaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTrades();
    this.loadHoldings();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTrades(): void {
    this.tradeService.getTrades()
      .pipe(takeUntil(this.destroy$))
      .subscribe(trades => {
        this.trades = trades;
      });
  }

  loadHoldings(): void {
    this.holdingsError = '';
    this.zerodhaService.getHoldings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (holdings) => {
          this.holdings = holdings;
        },
        error: (error) => {
          this.holdingsError = 'Failed to load holdings. Please check your authentication.';
          this.holdings = [];
        }
      });
  }

  refreshTrades(): void {
    this.tradeService.refreshTrades();
    this.snackBar.open('Trades refreshed', 'Close', { duration: 3000 });
  }

  showAccountDetails(): void {
    this.zerodhaService.getAccountDetails()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (details) => {
          this.accountDetails = JSON.stringify(details, null, 2);
        },
        error: (error) => {
          this.snackBar.open('Failed to load account details', 'Close', { duration: 3000 });
        }
      });
  }

  showMargins(): void {
    this.zerodhaService.getMargins()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (margins) => {
          this.margins = JSON.stringify(margins, null, 2);
        },
        error: (error) => {
          this.snackBar.open('Failed to load margins', 'Close', { duration: 3000 });
        }
      });
  }

  sellTrade(trade: Trade): void {
    const orderRequest = {
      symbol: trade.symbol,
      quantity: 1, // Default quantity
      transactionType: 'SELL' as const,
      orderType: 'MARKET' as const,
      product: 'CNC' as const
    };

    this.zerodhaService.placeMarketOrder(orderRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackBar.open(`Sell order placed for ${trade.symbol}`, 'Close', { duration: 3000 });
          if (trade.id) {
            this.tradeService.removeTrade(trade.id);
          }
          this.loadHoldings(); // Refresh holdings after trade
        },
        error: (error) => {
          this.snackBar.open('Failed to place sell order', 'Close', { duration: 3000 });
        }
      });
  }

  sellHolding(holding: Holding): void {
    const orderRequest = {
      symbol: holding.symbol,
      quantity: holding.quantity,
      transactionType: 'SELL' as const,
      orderType: 'MARKET' as const,
      product: 'CNC' as const
    };

    this.zerodhaService.placeMarketOrder(orderRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.snackBar.open(`Sell order placed for ${holding.symbol}`, 'Close', { duration: 3000 });
          this.loadHoldings(); // Refresh holdings after trade
        },
        error: (error) => {
          this.snackBar.open('Failed to place sell order', 'Close', { duration: 3000 });
        }
      });
  }

  logout(): void {
    this.zerodhaService.clearCredentials();
    window.location.reload();
  }
}