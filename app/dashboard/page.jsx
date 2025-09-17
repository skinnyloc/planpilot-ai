import { Link } from 'react-router-dom';
import { Lightbulb, FileText, Send, CreditCard } from 'lucide-react';

export default function DashboardPage() {
  const actionCards = [
    {
      title: 'Business Ideas',
      description: 'Explore and develop your business concepts',
      href: '/business-idea',
      icon: Lightbulb,
      color: 'bg-blue-50 border-blue-200 hover:bg-blue-100'
    },
    {
      title: 'Business Plans',
      description: 'Create comprehensive business plans',
      href: '/business-plans',
      icon: FileText,
      color: 'bg-green-50 border-green-200 hover:bg-green-100'
    },
    {
      title: 'Grant Proposals',
      description: 'Submit and manage grant applications',
      href: '/grant-proposals',
      icon: Send,
      color: 'bg-purple-50 border-purple-200 hover:bg-purple-100'
    },
    {
      title: 'Credit Guide',
      description: 'Learn about business credit and financing',
      href: '/credit-guide',
      icon: CreditCard,
      color: 'bg-orange-50 border-orange-200 hover:bg-orange-100'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Card */}
      <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-card-foreground mb-2">
          Welcome to Your Business Hub
        </h1>
        <p className="text-muted-foreground">
          Manage your business ideas, plans, and funding opportunities all in one place.
        </p>
      </div>

      {/* Summary Area */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          You have <span className="font-semibold text-foreground">3</span> business ideas
        </p>
      </div>

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {actionCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link
              key={card.title}
              to={card.href}
              className={`block border rounded-lg p-6 transition-colors ${card.color}`}
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {card.description}
                  </p>
                  <div className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80">
                    Get Started →
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}