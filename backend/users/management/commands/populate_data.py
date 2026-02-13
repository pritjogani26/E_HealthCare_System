"""
Script to populate Gender, BloodGroup, and Qualification tables
"""
from django.core.management.base import BaseCommand
from users.models import Gender, BloodGroup, Qualification


class Command(BaseCommand):
    help = 'Populate Gender, BloodGroup, and Qualification tables with initial data'

    def handle(self, *args, **options):
        self.stdout.write('Populating database...')

        # Create Genders
        genders = ['Male', 'Female', 'Other']
        for g in genders:
            gender, created = Gender.objects.get_or_create(gender_value=g)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created gender: {g}'))
            else:
                self.stdout.write(f'Gender already exists: {g}')

        # Create Blood Groups
        blood_groups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        for bg in blood_groups:
            blood_group, created = BloodGroup.objects.get_or_create(blood_group_value=bg)
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created blood group: {bg}'))
            else:
                self.stdout.write(f'Blood group already exists: {bg}')

        # Create Qualifications
        qualifications = [
            ('MBBS', 'Bachelor of Medicine, Bachelor of Surgery'),
            ('MD', 'Doctor of Medicine'),
            ('MS', 'Master of Surgery'),
            ('BDS', 'Bachelor of Dental Surgery'),
            ('MDS', 'Master of Dental Surgery'),
            ('BAMS', 'Bachelor of Ayurvedic Medicine and Surgery'),
            ('BHMS', 'Bachelor of Homeopathic Medicine and Surgery'),
            ('BUMS', 'Bachelor of Unani Medicine and Surgery'),
            ('DM', 'Doctorate of Medicine'),
            ('MCh', 'Master of Chirurgiae'),
        ]
        for code, name in qualifications:
            qual, created = Qualification.objects.get_or_create(
                qualification_code=code,
                defaults={'qualification_name': name, 'is_active': True}
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created qualification: {code} - {name}'))
            else:
                self.stdout.write(f'Qualification already exists: {code}')

        self.stdout.write(self.style.SUCCESS('\nDatabase populated successfully!'))
        self.stdout.write(f'Genders: {Gender.objects.count()}')
        self.stdout.write(f'Blood Groups: {BloodGroup.objects.count()}')
        self.stdout.write(f'Qualifications: {Qualification.objects.count()}')
