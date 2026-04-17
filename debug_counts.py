import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent / "repomap_roles"))

from repomap_roles import create_system, Role
from repomap_roles.demo import SAMPLE_FILES

system = create_system()
system.initialize_repository(SAMPLE_FILES)
view = system.get_role_view(Role.DEVOPS)

for priority in ['primary', 'supporting', 'context']:
    files = view.get(priority, [])
    print(f'{priority.upper()}: {len(files)} files')
    for f in files:
        print(f'  - {f["file"]}')
