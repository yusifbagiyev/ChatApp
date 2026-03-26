namespace ChatApp.Modules.Identity.Domain.Entities
{
    /// <summary>
    /// Many-to-many əlaqə: bir işçinin birdən çox rəhbəri ola bilər.
    /// Junction table: employee_supervisors
    /// </summary>
    public class EmployeeSupervisor
    {
        public Guid EmployeeId { get; private set; }
        public Employee Employee { get; private set; } = null!;

        public Guid SupervisorEmployeeId { get; private set; }
        public Employee SupervisorEmployee { get; private set; } = null!;

        public DateTime AssignedAtUtc { get; private set; }

        private EmployeeSupervisor() { }

        public EmployeeSupervisor(Guid employeeId, Guid supervisorEmployeeId)
        {
            if (employeeId == Guid.Empty)
                throw new ArgumentException("EmployeeId is required", nameof(employeeId));
            if (supervisorEmployeeId == Guid.Empty)
                throw new ArgumentException("SupervisorEmployeeId is required", nameof(supervisorEmployeeId));
            if (employeeId == supervisorEmployeeId)
                throw new ArgumentException("Employee cannot supervise themselves");

            EmployeeId = employeeId;
            SupervisorEmployeeId = supervisorEmployeeId;
            AssignedAtUtc = DateTime.UtcNow;
        }
    }
}
