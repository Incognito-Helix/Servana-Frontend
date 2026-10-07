import { Badge } from "../components/ui/badge"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select"

const badges = [
  ["verified", "Verified"],
  ["sponsored", "Sponsored"],
  ["pending", "Pending"],
  ["rejected", "Rejected"],
  ["suspended", "Suspended"],
  ["homeService", "Home service"],
  ["remote", "Works remotely"],
  ["confirmed", "Confirmed hire"],
]

function Section({ title, children }) {
  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl font-bold">{title}</h2>
      <div className="mt-4 flex flex-wrap items-start gap-3">{children}</div>
    </section>
  )
}

export default function DevUI() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="font-heading text-4xl font-bold text-primary">Servana UI</h1>
      <p className="mt-2 text-muted-foreground">Bridal makeup, from ₦40,000</p>

      <Section title="Buttons">
        <Button>Show contact</Button>
        <Button variant="outline">Boost my profile</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button disabled>Disabled</Button>
      </Section>

      <Section title="Badges">
        {badges.map(([variant, label]) => (
          <Badge key={variant} variant={variant}>
            {label}
          </Badge>
        ))}
      </Section>

      <Section title="Form fields">
        <div className="grid w-full max-w-sm gap-2">
          <Label htmlFor="biz">Business name</Label>
          <Input id="biz" placeholder="Ada Beauty Studio" />
        </div>
        <div className="grid w-full max-w-sm gap-2">
          <Label>Category</Label>
          <Select>
            <SelectTrigger>
              <SelectValue placeholder="Pick a category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beauty">Beauty</SelectItem>
              <SelectItem value="events">Events</SelectItem>
              <SelectItem value="food">Food</SelectItem>
              <SelectItem value="home">Home</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Section>

      <Section title="Card">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Ada Beauty Studio</CardTitle>
            <CardDescription>Lekki, Lagos</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Badge variant="verified">Verified</Badge>
            <Badge variant="sponsored">Sponsored</Badge>
          </CardContent>
        </Card>
      </Section>
    </main>
  )
}
