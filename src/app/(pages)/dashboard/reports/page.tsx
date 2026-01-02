import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnrollmentChart } from "@/components/reports/enrollment-chart"
import { RevenueChart } from "@/components/reports/revenue-chart"
import { AttendanceChart } from "@/components/reports/attendance-chart"
import { ClassPopularityChart } from "@/components/reports/class-popularity-chart"
import { getFinancialStats, getClassPerformance, getAttendanceStats } from "@/app/actions/reports"

export default async function ReportsPage() {
  const [financial, classPerformance, attendanceStats] = await Promise.all([
    getFinancialStats(),
    getClassPerformance(),
    getAttendanceStats(),
  ])

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">View insights and performance metrics</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Student Enrollment Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <EnrollmentChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceChart />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Class Popularity</CardTitle>
              </CardHeader>
              <CardContent>
                <ClassPopularityChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Revenue</span>
                    <span className="text-xl font-bold">${financial.totalRevenue?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total Expenses</span>
                    <span className="text-xl font-bold">${financial.totalExpenses?.toFixed(2) || "0.00"}</span>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t">
                    <span className="font-semibold">Net Profit</span>
                    <span
                      className={`text-xl font-bold ${(financial.netProfit || 0) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      ${financial.netProfit?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Chart</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Overall Attendance Rate</p>
                  <p className="text-3xl font-bold">{attendanceStats.overallRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Late Arrivals</p>
                  <p className="text-3xl font-bold">{attendanceStats.lateRate || 0}%</p>
                  <p className="text-xs text-muted-foreground">Of all attendance</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Total Records</p>
                  <p className="text-3xl font-bold">{attendanceStats.totalRecords || 0}</p>
                  <p className="text-xs text-muted-foreground">This month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="classes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Class Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {classPerformance.length > 0 ? (
                  classPerformance.map((classItem: any) => (
                    <div key={classItem.classId} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{classItem.className}</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Enrollment</p>
                          <p className="font-medium">
                            {classItem.enrolled}/{classItem.capacity}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Capacity</p>
                          <p className="font-medium">{Math.round((classItem.enrolled / classItem.capacity) * 100)}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium">
                            {classItem.enrolled >= classItem.capacity ? "Full" : "Available"}
                          </p>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${(classItem.enrolled / classItem.capacity) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">No class performance data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
