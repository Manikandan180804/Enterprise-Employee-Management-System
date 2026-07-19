import 'dotenv/config';
import bcrypt from 'bcryptjs';
import prisma from '../src/config/database';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create departments
  const departments = await Promise.all([
    prisma.department.upsert({ where: { name: 'Engineering' },    update: {}, create: { name: 'Engineering',     description: 'Software development and engineering' } }),
    prisma.department.upsert({ where: { name: 'Human Resources' },update: {}, create: { name: 'Human Resources', description: 'HR and talent management' } }),
    prisma.department.upsert({ where: { name: 'Finance' },        update: {}, create: { name: 'Finance',         description: 'Finance and accounting' } }),
    prisma.department.upsert({ where: { name: 'Marketing' },      update: {}, create: { name: 'Marketing',       description: 'Marketing and brand management' } }),
    prisma.department.upsert({ where: { name: 'Operations' },     update: {}, create: { name: 'Operations',      description: 'Business operations and logistics' } }),
    prisma.department.upsert({ where: { name: 'Sales' },          update: {}, create: { name: 'Sales',           description: 'Sales and business development' } }),
  ]);

  console.log(`✅ Created ${departments.length} departments`);

  // ── Super Admin ──────────────────────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('Admin@123', 12);

  const adminEmployee = await prisma.employee.upsert({
    where: { employeeId: 'EMP001' },
    update: {},
    create: {
      employeeId:  'EMP001',
      firstName:   'System',
      lastName:    'Administrator',
      email:       'admin@ems.com',
      phone:       '+1-555-0001',
      departmentId: departments[0].id,
      designation: 'System Administrator',
      salary:      150000,
      joiningDate: new Date('2020-01-01'),
      status:      'ACTIVE',
      role:        'SUPER_ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin@ems.com' },
    update: {},
    create: {
      email:        'admin@ems.com',
      passwordHash: adminPasswordHash,
      employeeId:   adminEmployee.id,
    },
  });

  // ── HR Manager ───────────────────────────────────────────────────
  const hrPasswordHash = await bcrypt.hash('Hr@123456', 12);

  const hrEmployee = await prisma.employee.upsert({
    where: { employeeId: 'EMP002' },
    update: {},
    create: {
      employeeId:  'EMP002',
      firstName:   'Sarah',
      lastName:    'Johnson',
      email:       'sarah.johnson@ems.com',
      phone:       '+1-555-0002',
      departmentId: departments[1].id,
      designation: 'HR Manager',
      salary:      85000,
      joiningDate: new Date('2021-03-15'),
      status:      'ACTIVE',
      role:        'HR_MANAGER',
      managerId:   adminEmployee.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'sarah.johnson@ems.com' },
    update: {},
    create: {
      email:        'sarah.johnson@ems.com',
      passwordHash: hrPasswordHash,
      employeeId:   hrEmployee.id,
    },
  });

  // ── Sample Employees ─────────────────────────────────────────────
  const samples = [
    { id: 'EMP003', first: 'Michael',  last: 'Chen',       email: 'michael.chen@ems.com',       dept: 0, designation: 'Senior Engineer',        salary: 110000 },
    { id: 'EMP004', first: 'Emily',    last: 'Rodriguez',  email: 'emily.rodriguez@ems.com',    dept: 0, designation: 'Frontend Developer',      salary: 90000  },
    { id: 'EMP005', first: 'David',    last: 'Kim',        email: 'david.kim@ems.com',          dept: 2, designation: 'Financial Analyst',        salary: 80000  },
    { id: 'EMP006', first: 'Jessica',  last: 'Thompson',   email: 'jessica.thompson@ems.com',   dept: 3, designation: 'Marketing Specialist',     salary: 75000  },
    { id: 'EMP007', first: 'Robert',   last: 'Martinez',   email: 'robert.martinez@ems.com',    dept: 4, designation: 'Operations Manager',       salary: 95000  },
    { id: 'EMP008', first: 'Lisa',     last: 'Anderson',   email: 'lisa.anderson@ems.com',      dept: 5, designation: 'Sales Executive',          salary: 70000  },
  ];

  const empPassHash = await bcrypt.hash('Employee@123', 12);
  const joinDates   = ['2022-02-14', '2022-04-01', '2022-06-20', '2021-11-05', '2023-01-10', '2023-03-22'];

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const employee = await prisma.employee.upsert({
      where: { employeeId: s.id },
      update: {},
      create: {
        employeeId:   s.id,
        firstName:    s.first,
        lastName:     s.last,
        email:        s.email,
        departmentId: departments[s.dept].id,
        designation:  s.designation,
        salary:       s.salary,
        joiningDate:  new Date(joinDates[i]),
        status:       'ACTIVE',
        role:         'EMPLOYEE',
        managerId:    adminEmployee.id,
      },
    });

    await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email:        s.email,
        passwordHash: empPassHash,
        employeeId:   employee.id,
      },
    });
  }

  console.log(`✅ Created ${samples.length + 2} employees`);
  console.log('\n🎉 Seed complete!');
  console.log('\n📋 Login credentials:');
  console.log('  Super Admin  →  admin@ems.com         /  Admin@123');
  console.log('  HR Manager   →  sarah.johnson@ems.com /  Hr@123456');
  console.log('  Employee     →  michael.chen@ems.com  /  Employee@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
