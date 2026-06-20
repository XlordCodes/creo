import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function PortalDashboardPage() {
  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold text-foreground">
        Client Dashboard
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Deliverables
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">--</p>
            <CardDescription className="mt-1">
              Pending your review
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Open Tickets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">--</p>
            <CardDescription className="mt-1">
              Support requests in progress
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Onboarding Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">--</p>
            <CardDescription className="mt-1">
              Complete your profile setup
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Upcoming Content</CardTitle>
          <CardDescription>
            Your next scheduled posts will appear here once wired to the API.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Connect to <code className="rounded bg-muted px-1.5 py-0.5 text-xs">GET /api/v1/portal/dashboard</code> to populate this view.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
