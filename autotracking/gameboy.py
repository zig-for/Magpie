# import evilemu
import socket

class Gameboy:
    def __init__(self):
        self.emulator = None
    
    def findEmulator(self):
        assert(False)

    def readRamByte(self, address):
        assert(False)
    
    def readRomByte(self, address):
        assert(False)
    
    def search(self, bytes):
        assert(False)


class RetroGameboy:
    socket = None
    address = None
    port = None
    def __init__(self, address="127.0.0.1", port=55355):
        self.address = address
        self.port = port
        print("init")
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        
        print(f"Connected to Retroarch {self.get_retroarch_version()}")
    
    def send(self, b):
        if type(b) is str:
            b = b.encode('ascii')
        self.socket.sendto(b, (self.address, self.port))

    def get_retroarch_version(self):
        self.send(b'VERSION\n')
        response_str, addr = self.socket.recvfrom(16)

        return response_str.rstrip()

    def findEmulator(self):
        # TODO:
        # actually check connection
        return True

    def read_memory(self, address, size=1):
        command = "READ_CORE_MEMORY"
        
        self.send(f'{command} {hex(address)} {size}\n')
        response = self.socket.recv(4096)
        
        splits = response.decode().split(" ", 2)

        assert(splits[0] == command)
        if splits[2].startswith("-1"):
            print(splits[2])
            print(hex(address))
            print(size)
        return bytearray.fromhex(splits[2])

    def readRamByte(self, address):
        return self.read_memory(address)[0]

    def readRomByte(self, address):
        return self.read_memory(address)[0]
    
    def read_rom(self, address, size):
        buf = bytearray()
        while(size):
            next_read_size = min(size, 1024)
            size -= next_read_size
            buf += self.read_memory(address, next_read_size)
            address += next_read_size
        return buf

    def search(self, bytes):
        assert(False)
        pass
 


class EvilGameboy:
    def __init__(self):
        self.emulator = None
    
    def findEmulator(self):
        self.emulator = None

        for emulator in evilemu.find_gameboy_emulators():
            self.emulator = emulator
            return True
        
        return False

    def readRamByte(self, address):
        if address < 0xE000:
            return self.emulator.read_ram8(address - 0xC000)
        elif address >= 0xFF80 and address <= 0xFFFF:
            return self.emulator.read_hram8(address - 0xFF80)
        
        return 0
    
    def readRomByte(self, address):
        return self.emulator.read_rom8(address)
    
    def search(self, bytes):
        process = self.emulator._Emulator__process
        for match in process.search(bytes, all_memory=True):
            pass
        pass
    
    def read_rom(self, address, size):
        return self.emulator.read_rom(address, size)