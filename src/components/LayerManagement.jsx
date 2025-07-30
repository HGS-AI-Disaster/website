import React, { useState } from "react"
import { Input } from "./ui/input"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
  MenubarSub,
  MenubarSubTrigger,
  MenubarSubContent,
} from "@/components/ui/menubar"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const data = [
  {
    id: "m5gr84i9",
    layer: "Layer 1",
    category: "Chiba University",
    amount: 316,
    visibility: "success",
  },
  {
    id: "3u1reuv4",
    layer: "Layer 2",
    category: "Chiba University",
    amount: 242,
    visibility: "success",
  },
  {
    id: "derv1ws0",
    layer: "Layer 3",
    category: "Chiba University",
    amount: 837,
    visibility: "processing",
  },
  {
    id: "5kma53ae",
    layer: "Layer 4",
    category: "Chiba University",
    amount: 874,
    visibility: "success",
  },
  {
    id: "bhqecj4p",
    layer: "Layer 5",
    category: "Chiba University",
    amount: 721,
    visibility: "failed",
  },
]

export const columns = [
  {
    accessorKey: "layer",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <div className="">Layer</div>
          <Button
            variant="ghost"
            className="hover:bg-gray-200 !p-1 h-fit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => <div>{row.getValue("layer")}</div>,
  },
  {
    accessorKey: "category",
    header: ({ column }) => {
      return (
        <div className="flex items-center gap-1">
          <div className="">Category</div>
          <Button
            variant="ghost"
            className="hover:bg-gray-200 !p-1 h-fit"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            <ArrowUpDown />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => <div>{row.getValue("category")}</div>,
  },
  {
    accessorKey: "visibility",
    header: "Visibility",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("visibility")}</div>
    ),
  },
  {
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"))
      // Format the amount as a dollar amount
      const formatted = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount)
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const payment = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(payment.id)}
            >
              Copy payment ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View payment details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

function LayerManagement() {
  const [sorting, setSorting] = useState([])
  const [columnFilters, setColumnFilters] = useState([])
  const [columnVisibility, setColumnVisibility] = useState({})
  const [rowSelection, setRowSelection] = useState({})
  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="bg-gray-200 p-12 z-50">
      <div className="bg-gray-50 py-8 px-12 rounded-lg">
        <div className="heading flex items-center">
          <div className="title flex-1">
            <div className="text-xl font-semibold">Layer Management</div>
            <div className="text-gray-400">Manage Layer (TIFF and GeoJSON)</div>
          </div>
          <div className="flex-1 flex justify-end gap-2">
            <Input
              placeholder="Search layer..."
              value={table.getColumn("layer")?.getFilterValue() ?? ""}
              onChange={(event) =>
                table.getColumn("layer")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>Filter</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>View All</MenubarItem>
                  <MenubarSeparator />
                  <MenubarSub>
                    <MenubarSubTrigger>Layer</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Category</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Layer date</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Date uploaded</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Source</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                  <MenubarSub>
                    <MenubarSubTrigger>Visibility</MenubarSubTrigger>
                    <MenubarSubContent>
                      <MenubarItem>View all</MenubarItem>
                      <MenubarSeparator />
                      <MenubarItem>Cloud Layer</MenubarItem>
                      <MenubarItem>Typhoon Layer</MenubarItem>
                      <MenubarItem>Flood Layer</MenubarItem>
                    </MenubarSubContent>
                  </MenubarSub>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
            <Dialog>
              <form>
                <DialogTrigger asChild>
                  <Button
                    className={
                      "cursor-pointer bg-blue-900 text-white hover:bg-blue-950 flex items-center gap-1"
                    }
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="21"
                      height="21"
                      fill="currentColor"
                      className="bi bi-plus"
                      viewBox="0 0 14 14"
                    >
                      <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4" />
                    </svg>
                    <div className="text">Add Layer</div>
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Layer</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4">
                    <div className="grid gap-3">
                      <Label htmlFor="username-1">Username</Label>
                      <Input
                        id="username-1"
                        name="username"
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type={"password"}
                        name="password"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button type="submit">Login</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </form>
            </Dialog>
          </div>
        </div>
        <div className="table w-full">
          <div className="overflow-hidden rounded-md border mt-8">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      )
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center"
                    >
                      No results.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-muted-foreground flex-1 text-sm">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LayerManagement
