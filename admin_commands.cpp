// Add project-specific admin actions here. Only commands implemented in this
// file can be run from the admin page; browser input is never passed to a shell.
#include <iostream>
#include <string>

int main(int argc, char* argv[]) {
    if (argc != 2) {
        std::cerr << "Usage: admin_commands <command-name>\n";
        return 2;
    }

    const std::string command = argv[1];
    if (command == "help") {
        std::cout << "Available commands: help, status\n";
        return 0;
    }
    if (command == "status") {
        std::cout << "Aviator admin command service is running.\n";
        return 0;
    }

    std::cerr << "Unknown command. Run help to see available commands.\n";
    return 1;
}
